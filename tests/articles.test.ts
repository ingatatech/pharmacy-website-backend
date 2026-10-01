import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { repo } from "../src/db/data-source";
import { Article } from "../src/db/entities";
import { loginAsAdmin, loginAsReviewer } from "./helpers/auth";

const TEST_SLUG = "vitest-article-people-relation";

describe("Articles", () => {
  let adminToken: string;
  let reviewerToken: string;
  let articleId: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    // Review, not publish: approve/reject are pharmacist_reviewer-only, while
    // create, submit-for-review and publish are admin-only.
    reviewerToken = await loginAsReviewer();
  });

  afterAll(async () => {
    await repo(Article).delete({ slug: TEST_SLUG });
  });

  // The regression this guards: every mutation endpoint returned the bare
  // article row, with no `author` relation. The admin form stores that response
  // straight into state and then renders `article.author.fullName`, so
  // publishing (or simply saving) threw a TypeError on the next render and the
  // whole admin route was replaced by the error boundary.
  describe("author/reviewer relations on every response", () => {
    const expectPeople = (body: Record<string, unknown>, label: string) => {
      expect(body.author, `${label} is missing author`).toBeTruthy();
      expect((body.author as { fullName?: string }).fullName).toBeTruthy();
      // reviewer is legitimately null until an admin approves, so only its
      // presence as a key is asserted, not its value.
      expect(body).toHaveProperty("reviewer");
      // The entity marks passwordHash `select: false`, and that must survive the include.
      expect(body.passwordHash).toBeUndefined();
    };

    it("includes author on create and on every workflow transition", async () => {
      const created = await request(app)
        .post("/api/articles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Vitest Relations", slug: TEST_SLUG, content: "Body copy." });

      expect(created.status).toBe(201);
      articleId = created.body.id;
      expectPeople(created.body, "POST /api/articles");

      // draft -> pending_review
      const submitted = await request(app)
        .post(`/api/articles/${articleId}/submit-for-review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(submitted.status).toBe(200);
      expectPeople(submitted.body, "submit-for-review");

      // pending_review -> approved, done by the pharmacist reviewer.
      const approved = await request(app)
        .post(`/api/articles/${articleId}/approve`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .send({});
      expect(approved.status).toBe(200);
      expectPeople(approved.body, "approve");
      expect((approved.body.reviewer as { fullName?: string } | null)?.fullName).toBeTruthy();

      // approved -> published: the exact call that used to white-screen admin.
      const published = await request(app)
        .post(`/api/articles/${articleId}/publish`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(published.status).toBe(200);
      expect(published.body.status).toBe("published");
      expectPeople(published.body, "publish");
    });

    it("includes author on update (saving an edit)", async () => {
      const updated = await request(app)
        .patch(`/api/articles/${articleId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Vitest Relations (edited)" });

      expect(updated.status).toBe(200);
      expectPeople(updated.body, "PATCH /api/articles/:id");
    });

    it("includes author in the admin list the edit page loads from", async () => {
      const list = await request(app)
        .get("/api/articles/admin/all")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(list.status).toBe(200);
      const found = (list.body as Array<Record<string, unknown>>).find((a) => a.id === articleId);
      expect(found, "test article missing from admin list").toBeTruthy();
      expectPeople(found as Record<string, unknown>, "GET /api/articles/admin/all");
    });
  });
});