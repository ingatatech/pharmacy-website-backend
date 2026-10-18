import { CorsOptions } from "cors";

// Local frontends used by `npm run dev` / Docker Compose. These are only ever
// allowed outside production, so a misconfigured deploy can never fall back to
// "anything on localhost is trusted" as a shortcut past the real allowlist.
const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

const isProduction = process.env.NODE_ENV === "production";

/**
 * FRONTEND_URL is a comma-separated allowlist so a single deployment can trust
 * more than one origin (e.g. the production domain and a staging one). Each
 * entry is trimmed and its trailing slash removed, because the browser sends
 * an Origin like "https://example.com" with no trailing slash — a stray slash
 * in configuration would otherwise silently fail to match.
 *
 * An entry may also be a subdomain wildcard such as "https://*.vercel.app",
 * which matches that domain and any subdomain of it. This is opt-in: it is
 * never assumed, only used when written into the environment variable.
 */
function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return [...new Set(origins)];
}

const configuredOrigins = parseAllowedOrigins(process.env.FRONTEND_URL);

// Production trusts exactly what is configured. Development additionally trusts
// the local frontend(s), so the app works out of the box without every
// developer having to set FRONTEND_URL.
const allowedOrigins = isProduction
  ? configuredOrigins
  : [...new Set([...DEV_ORIGINS, ...configuredOrigins])];

if (configuredOrigins.length === 0) {
  console.warn(
    "FRONTEND_URL is not set. " +
      (isProduction
        ? "All cross-origin browser requests will be blocked until it lists the frontend origin(s)."
        : `Allowing ${DEV_ORIGINS.join(", ")} for local development only. Set FRONTEND_URL before deploying.`)
  );
}

function isAllowed(origin: string): boolean {
  return allowedOrigins.some((allowed) => {
    if (allowed.startsWith("https://*.")) {
      const suffix = allowed.slice("https://*".length); // e.g. ".vercel.app"
      try {
        return new URL(origin).hostname.endsWith(suffix);
      } catch {
        return false;
      }
    }

    return allowed === origin;
  });
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // No Origin header means a non-browser caller (curl, a server, same-origin
    // requests). CORS does not apply to those, so they are always allowed.
    if (!origin) {
      return callback(null, true);
    }

    // Passing `false` (rather than an Error) tells the cors middleware to simply
    // omit the Access-Control-Allow-Origin header, which the browser turns into
    // a CORS error — without producing a 500 through our error handler.
    callback(null, isAllowed(origin));
  },
};
