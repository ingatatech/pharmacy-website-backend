import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { repo } from "../src/db/data-source";
import { Article, User } from "../src/db/entities";
import { loginAsAdmin, loginAsReviewer, registerCustomer } from "./helpers/auth";

const TEST_SLUG = "vitest-article-people-relation";

describe("Articles", () => {
  let adminToken: string;
  let reviewerToken: string;
  let articleId: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    // Both roles may create articles; only the pharmacist reviewer may
    // approve/reject, and both roles may publish (see the block below).
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

  /**
   * The dead end this guards: publishing used to require status "approved",
   * approving was pharmacist-only, and the admin had no way to reach it — so a
   * solo admin could never publish anything. An admin may now publish straight
   * from a draft, while a pharmacist still has to sign off first.
   */
  describe("publishing permissions", () => {
    const createdIds: string[] = [];

    afterEach(async () => {
      // A published article changes what the public API returns, so everything
      // created here is removed again as soon as the test finishes.
      while (createdIds.length) {
        await repo(Article).delete({ id: createdIds.pop()! });
      }
    });

    async function createDraft(token: string, slug: string) {
      const created = await request(app)
        .post("/api/articles")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: `Publish flow ${slug}`, slug, content: "Body copy for the publish flow." });

      expect(created.status).toBe(201);
      createdIds.push(created.body.id as string);
      return created.body.id as string;
    }

    function publicIds() {
      return request(app)
        .get("/api/articles")
        .then((r) => (r.body as Array<{ id: string }>).map((a) => a.id));
    }

    it("lets an admin publish a draft immediately, and it shows up in the public feed", async () => {
      const id = await createDraft(adminToken, "vitest-admin-direct-publish");

      // Hidden from the public site while it is still a draft...
      expect(await publicIds()).not.toContain(id);

      const published = await request(app)
        .post(`/api/articles/${id}/publish`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(published.status).toBe(200);
      expect(published.body.status).toBe("published");
      expect(published.body.publishedAt).toBeTruthy();

      // ...and visible the moment it is published.
      expect(await publicIds()).toContain(id);
    });

    it("refuses a pharmacist who tries to publish before sign-off", async () => {
      const id = await createDraft(adminToken, "vitest-reviewer-too-early");

      const response = await request(app)
        .post(`/api/articles/${id}/publish`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/approved/i);
      expect(await publicIds()).not.toContain(id);
    });

    it("lets a pharmacist publish once the article is approved", async () => {
      const id = await createDraft(adminToken, "vitest-reviewer-publish-approved");

      await request(app)
        .post(`/api/articles/${id}/submit-for-review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      await request(app)
        .post(`/api/articles/${id}/approve`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .send({});

      const response = await request(app)
        .post(`/api/articles/${id}/publish`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("published");
      expect(await publicIds()).toContain(id);
    });

    it("lets a pharmacist submit their own draft for review", async () => {
      // Previously admin-only: a pharmacist could create an article but could
      // never move it out of draft, so their own drafts were unpublishable.
      const id = await createDraft(reviewerToken, "vitest-reviewer-self-submit");

      const response = await request(app)
        .post(`/api/articles/${id}/submit-for-review`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("pending_review");
    });

    it("refuses a self-registered customer with 403", async () => {
      const id = await createDraft(adminToken, "vitest-customer-cannot-publish");
      const customer = await registerCustomer("vitest-article-publish-customer@ingata.test");

      const response = await request(app)
        .post(`/api/articles/${id}/publish`)
        .set("Authorization", `Bearer ${customer.token}`)
        .send({});

      expect(response.status).toBe(403);
      expect(await publicIds()).not.toContain(id);

      await repo(User).delete(customer.id).catch(() => undefined);
    });

    it("refuses anonymous callers with 401", async () => {
      const id = await createDraft(adminToken, "vitest-anonymous-cannot-publish");

      const response = await request(app).post(`/api/articles/${id}/publish`).send({});

      expect(response.status).toBe(401);
      expect(await publicIds()).not.toContain(id);
    });
  });
});