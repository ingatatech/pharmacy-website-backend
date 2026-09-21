import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";
import { loginAsAdmin } from "./helpers/auth";

const TEST_CATEGORY_SLUG = "vitest-test-category";

describe("Categories", () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    // Idempotent: if a previous failed run left this behind, remove it so
    // the "create" test below can rely on the slug being free.
    await prisma.category.deleteMany({ where: { slug: TEST_CATEGORY_SLUG } });
  });

  afterAll(async () => {
    await prisma.category.deleteMany({ where: { slug: TEST_CATEGORY_SLUG } });
  });

  describe("GET /api/categories", () => {
    it("returns 200 and an array", async () => {
      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("filters by ?type=", async () => {
      const response = await request(app).get("/api/categories").query({ type: "product" });

      expect(response.status).toBe(200);
      for (const category of response.body) {
        expect(category.type).toBe("product");
      }
    });
  });

  describe("GET /api/categories/:slug", () => {
    it("returns 404 for a slug that doesn't exist", async () => {
      const response = await request(app).get("/api/categories/no-such-category-slug");

      expect(response.status).toBe(404);
    });

    it("returns the category for a slug that does exist", async () => {
      // Self-contained: creates and cleans up its own category, so it
      // doesn't collide with the "POST creates a category" test below,
      // regardless of which one Vitest happens to run first.
      const slug = `${TEST_CATEGORY_SLUG}-get-by-slug`;

      const createResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Vitest Category", slug, type: "product" });
      expect(createResponse.status).toBe(201);

      const response = await request(app).get(`/api/categories/${slug}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ slug, type: "product" });

      await prisma.category.delete({ where: { id: createResponse.body.id } });
    });
  });

  describe("POST /api/categories", () => {
    it("rejects an unauthenticated request with 401", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "Vitest Category", slug: TEST_CATEGORY_SLUG, type: "product" });

      expect(response.status).toBe(401);
    });

    it("rejects an invalid body with 400 (missing required fields)", async () => {
      const response = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Missing slug and type" });

      expect(response.status).toBe(400);
      expect(response.body.details).toBeDefined();
    });

    it("rejects an invalid enum value for type with 400", async () => {
      const response = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Bad Type", slug: TEST_CATEGORY_SLUG, type: "not-a-real-type" });

      expect(response.status).toBe(400);
    });

    it("creates a category as admin and it becomes fetchable", async () => {
      const createResponse = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Vitest Category", slug: TEST_CATEGORY_SLUG, type: "product" });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toMatchObject({
        name: "Vitest Category",
        slug: TEST_CATEGORY_SLUG,
        type: "product",
      });

      const listResponse = await request(app).get("/api/categories").query({ type: "product" });
      const slugs = listResponse.body.map((c: { slug: string }) => c.slug);
      expect(slugs).toContain(TEST_CATEGORY_SLUG);
    });
  });
});
