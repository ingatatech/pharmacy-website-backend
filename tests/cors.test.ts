import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

// CORS is enforced by the BROWSER, not by the server or by tools like
// Supertest/curl. The server's only job is to decide what to put in the
// `Access-Control-Allow-Origin` response header; a browser then refuses to
// let JS read the response unless that header equals the page's own origin.
// curl/Supertest can read the response either way — they don't enforce
// anything. So what's actually testable here, server-side, is the header's
// VALUE: does it match an allowed origin, and is it absent for one that is not.
//
// The suite runs with NODE_ENV=test (not production), so the development
// origins — http://localhost:3000 and http://127.0.0.1:3000 — are always
// allowed here, regardless of whether FRONTEND_URL is set.
describe("CORS", () => {
  it("reflects an allowed dev origin", async () => {
    const response = await request(app).get("/api/health").set("Origin", "http://localhost:3000");

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("also allows the 127.0.0.1 spelling of the dev origin", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://127.0.0.1:3000");

    expect(response.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:3000");
  });

  it("omits the allow-origin header for an unauthorized origin", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://not-our-frontend.example");

    // No header at all (rather than a different value) is what makes the
    // browser block the response — and it confirms we are not echoing the
    // request's own Origin back to everyone.
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("answers a preflight request from an allowed origin", async () => {
    const response = await request(app)
      .options("/api/auth/login")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type,authorization");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("still serves requests that carry no Origin header (non-browser callers)", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    // No Origin to reflect, so no allow-origin header is expected.
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
