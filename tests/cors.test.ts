import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

// CORS is enforced by the BROWSER, not by the server or by tools like
// Supertest/curl. The server's only job is to decide what to put in the
// `Access-Control-Allow-Origin` response header; a browser then refuses to
// let JS read the response unless that header equals the page's own origin.
// curl/Supertest can read the response either way — they don't enforce
// anything. So what's actually testable here, server-side, is the header's
// VALUE: does it match the configured frontend for that origin, and does it
// never equal a random, unauthorized origin's own value?
describe("CORS", () => {
  it("reflects the configured FRONTEND_URL for an allowed origin", async () => {
    const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

    const response = await request(app).get("/api/health").set("Origin", allowedOrigin);

    expect(response.headers["access-control-allow-origin"]).toBe(allowedOrigin);
  });

  it("never reflects a random, unauthorized origin back", async () => {
    // With a fixed-string `origin` config, the `cors` package always sends
    // back the SAME configured value on every response — it does not echo
    // whatever Origin the request sent. So a random origin's own value is
    // never what comes back; that mismatch is exactly what makes the
    // browser refuse to let that page read the response.
    const randomOrigin = "https://not-our-frontend.example";

    const response = await request(app).get("/api/health").set("Origin", randomOrigin);

    expect(response.headers["access-control-allow-origin"]).not.toBe(randomOrigin);
  });
});
