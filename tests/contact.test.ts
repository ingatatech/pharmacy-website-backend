import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";
import { loginAsAdmin, registerCustomer } from "./helpers/auth";

const ANON_EMAIL = "vitest-anon-contact@ingata.test";
const LINKED_EMAIL = "vitest-linked-contact@ingata.test";
const CUSTOMER_EMAIL = "vitest-contact-customer@ingata.test";

describe("Contact inquiries", () => {
  afterEach(async () => {
    await prisma.contactInquiry.deleteMany({ where: { email: { in: [ANON_EMAIL, LINKED_EMAIL] } } });
    await prisma.user.deleteMany({ where: { email: CUSTOMER_EMAIL } });
  });

  describe("POST /api/contact", () => {
    it("accepts an anonymous submission (no token) with no userId attached", async () => {
      const response = await request(app).post("/api/contact").send({
        fullName: "Anon Person",
        phoneNumber: "0788000000",
        email: ANON_EMAIL,
        message: "Hello, this is a valid anonymous message.",
      });

      expect(response.status).toBe(201);

      const stored = await prisma.contactInquiry.findFirstOrThrow({ where: { email: ANON_EMAIL } });
      expect(stored.userId).toBeNull();
    });

    it("links the inquiry to the caller's account when a valid token is sent", async () => {
      const customer = await registerCustomer(CUSTOMER_EMAIL);

      const response = await request(app)
        .post("/api/contact")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          fullName: "Logged In Person",
          phoneNumber: "0788000001",
          email: LINKED_EMAIL,
          message: "Hello, this is a valid logged-in message.",
        });

      expect(response.status).toBe(201);

      const stored = await prisma.contactInquiry.findFirstOrThrow({ where: { email: LINKED_EMAIL } });
      expect(stored.userId).toBe(customer.id);
    });

    it("still submits anonymously (not an error) when the token is invalid", async () => {
      const response = await request(app)
        .post("/api/contact")
        .set("Authorization", "Bearer not-a-real-token")
        .send({
          fullName: "Anon Person",
          phoneNumber: "0788000000",
          email: ANON_EMAIL,
          message: "Hello, this is a valid anonymous message.",
        });

      expect(response.status).toBe(201);

      const stored = await prisma.contactInquiry.findFirstOrThrow({ where: { email: ANON_EMAIL } });
      expect(stored.userId).toBeNull();
    });
  });

  describe("GET /api/contact/mine", () => {
    it("requires authentication", async () => {
      const response = await request(app).get("/api/contact/mine");

      expect(response.status).toBe(401);
    });

    it("returns only the caller's own inquiries, not anyone else's", async () => {
      const customer = await registerCustomer(CUSTOMER_EMAIL);

      await request(app)
        .post("/api/contact")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({
          fullName: "Logged In Person",
          phoneNumber: "0788000001",
          email: LINKED_EMAIL,
          message: "Hello, this is a valid logged-in message.",
        });
      // An anonymous submission that should NOT show up in the customer's list.
      await request(app).post("/api/contact").send({
        fullName: "Anon Person",
        phoneNumber: "0788000000",
        email: ANON_EMAIL,
        message: "Hello, this is a valid anonymous message.",
      });

      const response = await request(app)
        .get("/api/contact/mine")
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].email).toBe(LINKED_EMAIL);
    });
  });

  describe("GET /api/contact/admin/all", () => {
    it("still requires admin and still returns everything, linked or not (regression check)", async () => {
      const adminToken = await loginAsAdmin();

      await request(app).post("/api/contact").send({
        fullName: "Anon Person",
        phoneNumber: "0788000000",
        email: ANON_EMAIL,
        message: "Hello, this is a valid anonymous message.",
      });

      const response = await request(app)
        .get("/api/contact/admin/all")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.some((i: { email: string }) => i.email === ANON_EMAIL)).toBe(true);
    });
  });
});
