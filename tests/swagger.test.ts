import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import spec from "../src/swagger";

type Operation = { security?: unknown[] };
const paths = (spec.paths ?? {}) as Record<string, Record<string, Operation>>;

describe("Swagger spec documents only the public API", () => {
  it("keeps the sign-up, login and health endpoints", () => {
    expect(paths).toHaveProperty("/api/auth/register");
    expect(paths).toHaveProperty("/api/auth/login");
    expect(paths).toHaveProperty("/api/health");
  });

  it("never exposes the admin, audit-log or pharmacist surfaces", () => {
    for (const path of Object.keys(paths)) {
      expect(path.startsWith("/api/admin"), `${path} should not be documented`).toBe(false);
      expect(path.startsWith("/api/audit-logs"), `${path} should not be documented`).toBe(false);
      expect(path.startsWith("/api/pharmacist"), `${path} should not be documented`).toBe(false);
    }
  });

  it("documents only operations that require no authentication", () => {
    for (const [path, item] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(item)) {
        const requiresAuth = Array.isArray(operation.security) && operation.security.length > 0;
        expect(requiresAuth, `${method.toUpperCase()} ${path} must be public`).toBe(false);
      }
    }
  });
});

describe("GET /api-docs", () => {
  it("is served when not in production", async () => {
    const response = await request(app).get("/api-docs/");

    expect(response.status).toBe(200);
  });
});
