import { execSync } from "node:child_process";
import { config as loadEnv } from "dotenv";

// Vitest runs this file exactly once, in its own process, before any test
// file or worker starts. It exists purely to make sure the test database's
// schema is up to date — it does not share any state with the tests
// themselves (that's what tests/setup.ts is for).
export default function globalSetup() {
  // Locally this reads .env.test. In CI there is no .env.test file (it's
  // gitignored) — DATABASE_URL is set directly by the workflow instead, and
  // dotenv simply does nothing if the file isn't there.
  loadEnv({ path: ".env.test" });

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set for tests. Create a .env.test file (see .env.example) " +
        "pointing at a separate test database before running `npm test`."
    );
  }

  if (!process.env.DATABASE_URL.includes("test")) {
    throw new Error(
      `DATABASE_URL for tests does not look like a test database ("${process.env.DATABASE_URL}"). ` +
        "Refusing to run migrations against what might be your real database. " +
        'Its name should contain "test".'
    );
  }

  console.log("Applying migrations to the test database...");
  // Run in a child process rather than importing AppDataSource here: this file
  // is loaded as ESM by Vitest, and TypeORM is CommonJS, so a named-import
  // failure there would take the whole run down. The child gets DATABASE_URL
  // through `env`, and dotenv.config() inside data-source does not override
  // variables that are already set — so the test database wins over any
  // DATABASE_URL in a local .env.
  execSync("npm run db:migrate", { stdio: "inherit", env: process.env });
}