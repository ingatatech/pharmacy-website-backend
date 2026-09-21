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
