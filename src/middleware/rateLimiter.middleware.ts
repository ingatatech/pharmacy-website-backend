import rateLimit from "express-rate-limit";

// The test suite deliberately sends many requests to the same public
// endpoint in quick succession, from different tests, to exercise different
// validation scenarios — that's normal test behavior, not the abuse this
// limiter exists to stop. Without this, tests/auth.test.ts alone would trip
// the real limit and start getting 429s instead of the status codes it's
// actually asserting on.
const skipInTests = () => process.env.NODE_ENV === "test";

export const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: skipInTests,
});

// A separate bucket from publicFormLimiter: account creation is a higher-value
// abuse target than a contact-form message, and sharing one limiter would let
// someone's contact/refill submissions eat into their registration attempts
// (and vice versa) since express-rate-limit counts per limiter instance, not
// per route.
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: skipInTests,
});

// Without this, nothing stops unlimited password guesses against any
// account, including admin ones. 10/15min (rather than the 5 used
// elsewhere) is deliberately a bit more generous than the other limiters —
// legitimate users mistype passwords more often than they double-submit a
// contact form — while still making sustained brute-forcing from one IP
// impractical (an attacker gains nothing by trying faster than this; they'd
// have to spread attempts across many IPs, a much costlier attack).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: skipInTests,
});
