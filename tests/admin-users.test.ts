import { describe, it, expect, beforeAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { In } from "typeorm";
import { repo } from "../src/db/data-source";
import { User } from "../src/db/entities";
import { loginAsAdmin, loginAsReviewer, registerCustomer } from "./helpers/auth";

const NEW_REVIEWER_EMAIL = "vitest-new-reviewer@ingata.test";
const NEW_ADMIN_EMAIL = "vitest-new-admin@ingata.test";
const NEW_CUSTOMER_EMAIL = "vitest-admin-managed-customer@ingata.test";

describe("Admin user management (/api/admin/users)", () => {
  let adminToken: string;
  let reviewerToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    reviewerToken = await loginAsReviewer();
  });

  // Clean up anything a test created, so re-running the suite never fails
  // on "email already exists" and never leaves the test database dirty.
  afterEach(async () => {
    await repo(User).delete({
      email: In([NEW_REVIEWER_EMAIL, NEW_ADMIN_EMAIL, NEW_CUSTOMER_EMAIL]),
    });
  });

  describe("POST /api/admin/users", () => {
    it("lets an admin create a pharmacist_reviewer account", async () => {
      const response = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "New Reviewer",
          email: NEW_REVIEWER_EMAIL,
          password: "reviewer-password123",
          role: "pharmacist_reviewer",
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        email: NEW_REVIEWER_EMAIL,
        role: "pharmacist_reviewer",
      });
      expect(response.body.passwordHash).toBeUndefined();
    });

    it("lets an admin create another admin account", async () => {
      const response = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "New Admin",
          email: NEW_ADMIN_EMAIL,
          password: "admin-password123",
          role: "admin",
        });

      expect(response.status).toBe(201);
      expect(response.body.role).toBe("admin");
    });

    it("stores the password hashed, never in plain text", async () => {
      const plainPassword = "reviewer-password123";
      const createResponse = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "New Reviewer",
          email: NEW_REVIEWER_EMAIL,
          password: plainPassword,
          role: "pharmacist_reviewer",
        });

const stored = await repo(User).findOneOrFail({
        where: { id: createResponse.body.id },
        // Explicit opt-in: the entity marks passwordHash `select: false`, so
        // reading it back is deliberate rather than the default.
        select: { id: true, passwordHash: true },
      });

      expect(stored.passwordHash).not.toBe(plainPassword);
      // bcrypt hashes always start with one of these version prefixes.
      expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it("rejects an unauthenticated request with 401", async () => {
      const response = await request(app).post("/api/admin/users").send({
        fullName: "New Reviewer",
        email: NEW_REVIEWER_EMAIL,
        password: "reviewer-password123",
        role: "pharmacist_reviewer",
      });

      expect(response.status).toBe(401);
    });

    it("rejects a non-admin (pharmacist_reviewer) caller with 403", async () => {
      // This app has no generic "normal user" role — pharmacist_reviewer is
      // the real, authenticated-but-not-admin role, so it stands in for
      // "normal user" here.
      const response = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${reviewerToken}`)
        .send({
          fullName: "New Reviewer",
          email: NEW_REVIEWER_EMAIL,
          password: "reviewer-password123",
          role: "pharmacist_reviewer",
        });

      expect(response.status).toBe(403);
    });

    it("rejects an invalid email with 400", async () => {
      const response = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "New Reviewer",
          email: "not-an-email",
          password: "reviewer-password123",
          role: "pharmacist_reviewer",
        });

      expect(response.status).toBe(400);
    });

    it("rejects a password shorter than 8 characters with 400", async () => {
      const response = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "New Reviewer",
          email: NEW_REVIEWER_EMAIL,
          password: "short",
          role: "pharmacist_reviewer",
        });

      expect(response.status).toBe(400);
    });

    it("rejects an invalid role with 400", async () => {
      const response = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "New Reviewer",
          email: NEW_REVIEWER_EMAIL,
          password: "reviewer-password123",
          role: "superuser",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/admin/users", () => {
    it("rejects an unauthenticated request with 401", async () => {
      const response = await request(app).get("/api/admin/users");

      expect(response.status).toBe(401);
    });

    it("rejects a non-admin caller with 403", async () => {
      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${reviewerToken}`);

      expect(response.status).toBe(403);
    });

    it("lets an admin list users, without exposing password hashes", async () => {
      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      for (const user of response.body) {
        expect(user.passwordHash).toBeUndefined();
      }
    });
  });

  describe("PATCH and DELETE /api/admin/users/:id", () => {
    it("lets an admin update a user's role, and then delete them", async () => {
      const createResponse = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "New Reviewer",
          email: NEW_REVIEWER_EMAIL,
          password: "reviewer-password123",
          role: "pharmacist_reviewer",
        });
      const userId = createResponse.body.id;

      const updateResponse = await request(app)
        .patch(`/api/admin/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "admin" });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.role).toBe("admin");

      const deleteResponse = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(204);
    });

    it("returns 404 for a well-formed id that doesn't exist", async () => {
      const response = await request(app)
        .delete("/api/admin/users/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it("returns 400 for a malformed id", async () => {
      const response = await request(app)
        .delete("/api/admin/users/not-a-uuid")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe("self-protection", () => {
    it("refuses to let an admin delete their own account", async () => {
      const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${adminToken}`);

      const response = await request(app)
        .delete(`/api/admin/users/${me.body.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);

      // Confirm the account really is still there and can still log in.
      const stillWorks = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(stillWorks.status).toBe(200);
    });

    it("refuses to let an admin change their own role away from admin", async () => {
      const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${adminToken}`);

      const response = await request(app)
        .patch(`/api/admin/users/${me.body.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "pharmacist_reviewer" });

      expect(response.status).toBe(400);

      const stillAdmin = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${adminToken}`);
      expect(stillAdmin.body.role).toBe("admin");
    });

    it("still allows an admin to update their own non-role fields", async () => {
      const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${adminToken}`);

      const response = await request(app)
        .patch(`/api/admin/users/${me.body.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ fullName: me.body.fullName }); // no-op change, just proves it's not blanket-blocked

      expect(response.status).toBe(200);
    });
  });

  describe("the \"customer\" role", () => {
    it("is what a self-registered account gets, and it cannot reach any admin route", async () => {
      const customer = await registerCustomer(NEW_CUSTOMER_EMAIL);

      const list = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${customer.token}`);
      expect(list.status).toBe(403);

      const create = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({ fullName: "x", email: "x@x.com", password: "12345678", role: "admin" });
      expect(create.status).toBe(403);
    });

    it("a customer also cannot reach other staff-only routes (e.g. creating a service)", async () => {
      const customer = await registerCustomer(NEW_CUSTOMER_EMAIL);

      const response = await request(app)
        .post("/api/services")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({ name: "x", slug: "vitest-customer-blocked", shortDescription: "x" });

      expect(response.status).toBe(403);
    });

    it("only an admin can promote a customer to staff, and later demote them back", async () => {
      const customer = await registerCustomer(NEW_CUSTOMER_EMAIL);

      const promote = await request(app)
        .patch(`/api/admin/users/${customer.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "pharmacist_reviewer" });
      expect(promote.status).toBe(200);
      expect(promote.body.role).toBe("pharmacist_reviewer");

      const demote = await request(app)
        .patch(`/api/admin/users/${customer.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "customer" });
      expect(demote.status).toBe(200);
      expect(demote.body.role).toBe("customer");
    });

    it("a customer cannot promote themselves", async () => {
      const customer = await registerCustomer(NEW_CUSTOMER_EMAIL);

      const response = await request(app)
        .patch(`/api/admin/users/${customer.id}`)
        .set("Authorization", `Bearer ${customer.token}`)
        .send({ role: "admin" });

      // Blocked by requireRole("admin") on the whole router before it ever
      // reaches the "can't change your own role" self-protection check.
      expect(response.status).toBe(403);
    });
  });
});
