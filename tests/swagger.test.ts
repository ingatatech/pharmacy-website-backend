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
    expect(paths["/api/articles/{id}"]).toHaveProperty("delete");

    expect(paths["/api/site-settings"]).toHaveProperty("patch");
    expect(paths["/api/uploads"]).toHaveProperty("post");
  });

  it("documents the admin handling of contact and refill requests", () => {
    expect(paths["/api/contact/admin/{id}"]).toHaveProperty("patch");
    expect(paths["/api/contact/admin/{id}"]).toHaveProperty("delete");
    expect(paths["/api/prescription-refill/admin/{id}"]).toHaveProperty("patch");
    expect(paths["/api/prescription-refill/admin/{id}"]).toHaveProperty("delete");
  });

  it("keeps the pharmacist workspace read-only in the docs", () => {
    // Reads are shown...
    expect(paths).toHaveProperty("/api/pharmacist/branch");
    expect(paths["/api/pharmacist/branch"]).toHaveProperty("get");
    expect(paths).toHaveProperty("/api/pharmacist/refills");

    // ...but the write endpoints are not.
    expect(paths["/api/pharmacist/branch"]).not.toHaveProperty("patch");
    // Paths whose only operation is a write disappear entirely.
    expect(paths).not.toHaveProperty("/api/pharmacist/refills/{id}");
    expect(paths).not.toHaveProperty("/api/pharmacist/inquiries/{id}");
  });

  it("keeps the admin management and audit-log surface hidden", () => {
    for (const path of Object.keys(paths)) {
      expect(path.startsWith("/api/admin"), `${path} should not be documented`).toBe(false);
      expect(path.startsWith("/api/audit-logs"), `${path} should not be documented`).toBe(false);
    }
  });

  it("declares every tag with a description, in a stable order", () => {
    const tags = (spec.tags ?? []) as { name: string; description?: string }[];

    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) {
      expect(tag.description, `tag ${tag.name} has no description`).toBeTruthy();
    }
    // Every tag used by a visible operation must be declared, so the sidebar
    // groups them properly instead of falling back to an alphabetical list.
    const declared = new Set(tags.map((t) => t.name));
    const used = new Set<string>();
    for (const item of Object.values(paths)) {
      for (const op of Object.values(item) as { tags?: string[] }[]) {
        for (const t of op.tags ?? []) used.add(t);
      }
    }
    for (const tag of used) {
      expect(declared.has(tag), `tag ${tag} is used but not declared`).toBe(true);
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
