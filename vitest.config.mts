import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";

// Load .env.test here, in the config file itself, so the DATABASE_URL the
// tests connect to is guaranteed to be the test database *before* any test
// file (or anything it imports, like src/app.ts) ever runs. Explicitly
// re-injecting the parsed values via `test.env` below is a belt-and-suspenders
// step: it makes sure every test worker gets them even if process.env
// inheritance behaves differently across platforms/CI runners.
const testEnv = loadEnv({ path: ".env.test" }).parsed ?? {};

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    env: testEnv,
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
    // Integration tests share one real Postgres database, so running test
    // files in parallel risks one file's cleanup deleting another file's
    // in-progress data. Keep it simple and run files one at a time.
    fileParallelism: false,
  },
});
