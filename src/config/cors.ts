import { CorsOptions } from "cors";

const DEFAULT_DEV_ORIGIN = "http://localhost:3000";

const frontendUrl = process.env.FRONTEND_URL;

// Previously this fell back to `true` (allow every origin) when FRONTEND_URL
// was unset — effectively no CORS restriction at all. Now it fails safe to
// a single known dev origin instead, and says so loudly, rather than
// silently staying wide open if someone forgets to configure it.
if (!frontendUrl) {
  console.warn(
    `FRONTEND_URL is not set. Restricting CORS to ${DEFAULT_DEV_ORIGIN} for local development. ` +
      "Set FRONTEND_URL in your .env before deploying anywhere real."
  );
}

export const corsOptions: CorsOptions = {
  origin: frontendUrl || DEFAULT_DEV_ORIGIN,
};
