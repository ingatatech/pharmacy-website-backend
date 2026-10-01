import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { repo } from "../src/db/data-source";
import { Category, Product } from "../src/db/entities";

const TEST_CATEGORY_SLUG = "vitest-test-range";

describe("Products", () => {
  let categoryId: string;
  // Deliberately oldest-to-newest, but *inserted* middle-newest-oldest so that
  // a missing orderBy shows up as a failure rather than passing by accident.
  const expectedNewestFirst: string[] = [];

  beforeAll(async () => {
    const categories = repo(Category);
    const products = repo(Product);
    await categories.delete({ slug: TEST_CATEGORY_SLUG });

    const category = await categories.save(
      categories.create({ name: "Vitest Range", slug: TEST_CATEGORY_SLUG, type: "product" }),
    );
    categoryId = category.id;

    const base = Date.UTC(2020, 0, 1);
    // A *larger* offsetDays is a *newer* row.
    const fixtures = [
      { name: "Newest", slug: `${TEST_CATEGORY_SLUG}-newest`, offsetDays: 30, published: true },
      { name: "Middle", slug: `${TEST_CATEGORY_SLUG}-middle`, offsetDays: 20, published: true },
      { name: "Oldest", slug: `${TEST_CATEGORY_SLUG}-oldest`, offsetDays: 10, published: true },
      { name: "Hidden", slug: `${TEST_CATEGORY_SLUG}-hidden`, offsetDays: 5, published: false },
    ];

    const created = await Promise.all(
      // Reversed so insertion order runs oldest-to-newest, i.e. the exact
      // opposite of what the endpoint should return. Without an orderBy that
      // reversal is what the test would see, so it can only pass on merit.
      [...fixtures].reverse().map((f) =>
        products.save(
          products.create({
            name: f.name,
            slug: f.slug,
            isPublished: f.published,
            categoryId,
            createdAt: new Date(base + f.offsetDays * 86_400_000),
          }),
        ),
      ),
    );

    const byName = new Map(created.map((p) => [p.name, p.slug]));
    expectedNewestFirst.push(
      byName.get("Newest") as string,
      byName.get("Middle") as string,
      byName.get("Oldest") as string,
    );
  });

  afterAll(async () => {
    await repo(Product).delete({ categoryId });
    await repo(Category).delete({ id: categoryId });
  });

  describe("GET /api/products", () => {
    it("returns published products newest first", async () => {
      const response = await request(app)
        .get("/api/products")
        .query({ category: TEST_CATEGORY_SLUG });

      expect(response.status).toBe(200);
      expect(response.body.map((p: { slug: string }) => p.slug)).toEqual(
        expectedNewestFirst,
      );
    });

    it("excludes unpublished products", async () => {
      const response = await request(app)
        .get("/api/products")
        .query({ category: TEST_CATEGORY_SLUG });

      const slugs = response.body.map((p: { slug: string }) => p.slug);
      expect(slugs).not.toContain(`${TEST_CATEGORY_SLUG}-hidden`);
    });

    it("returns the same order on repeated calls", async () => {
      // The regression this guards: with no orderBy, Postgres is free to return
      // rows in any order, so the homepage teaser and /products could disagree
      // between cache refreshes.
      const first = await request(app).get("/api/products").query({ limit: 50 });
      const second = await request(app).get("/api/products").query({ limit: 50 });

      expect(first.body.map((p: { id: string }) => p.id)).toEqual(
        second.body.map((p: { id: string }) => p.id),
      );
    });

    it("respects ?limit=", async () => {
      const response = await request(app).get("/api/products").query({ limit: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("returns an empty array for a category with no products", async () => {
      const response = await request(app)
        .get("/api/products")
        .query({ category: "no-such-category-slug" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
