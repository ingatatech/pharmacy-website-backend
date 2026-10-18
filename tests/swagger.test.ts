import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import spec from "../src/swagger";

const paths = (spec.paths ?? {}) as Record<string, Record<string, unknown>>;

describe("Swagger spec", () => {
  it("documents the public auth and health endpoints", () => {
    expect(paths).toHaveProperty("/api/auth/register");
    expect(paths).toHaveProperty("/api/auth/login");
    expect(paths).toHaveProperty("/api/health");
  });

  it("exposes full CRUD for content resources", () => {
    // A representative sample across resources, covering create/update/delete.
    expect(paths["/api/services"]).toHaveProperty("post");
    expect(paths["/api/services/{id}"]).toHaveProperty("patch");
    expect(paths["/api/services/{id}"]).toHaveProperty("delete");

    expect(paths["/api/products"]).toHaveProperty("post");
    expect(paths["/api/products/{id}"]).toHaveProperty("delete");

    expect(paths["/api/faqs"]).toHaveProperty("post");
    expect(paths["/api/categories/{id}"]).toHaveProperty("delete");

    expect(paths["/api/articles"]).toHaveProperty("post");
    expect(paths["/api/site-settings"]).toHaveProperty("patch");
    expect(paths["/api/uploads"]).toHaveProperty("post");
  });

  it("keeps the admin management and audit-log surface hidden", () => {
    for (const path of Object.keys(paths)) {
      expect(path.startsWith("/api/admin"), `${path} should not be documented`).toBe(false);
      expect(path.startsWith("/api/audit-logs"), `${path} should not be documented`).toBe(false);
    }
  });

  it("defines a bearer auth scheme so the Authorize button works", () => {
    expect(spec.components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
  });
});

describe("GET /api-docs", () => {
  it("is served when not in production", async () => {
    const response = await request(app).get("/api-docs/");

    expect(response.status).toBe(200);
  });
});
