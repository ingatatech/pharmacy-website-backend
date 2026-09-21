import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";
import { loginAsAdmin, registerCustomer } from "./helpers/auth";

const ANON_PHONE = "0788111000";
const LINKED_PHONE = "0788111001";
const CUSTOMER_EMAIL = "vitest-refill-customer@ingata.test";

describe("Prescription refill requests", () => {
  afterEach(async () => {
    await prisma.refillRequest.deleteMany({ where: { phoneNumber: { in: [ANON_PHONE, LINKED_PHONE] } } });
    await prisma.user.deleteMany({ where: { email: CUSTOMER_EMAIL } });
  });

  describe("POST /api/prescription-refill", () => {
    it("accepts an anonymous submission (no token) with no userId attached", async () => {
      const response = await request(app)
        .post("/api/prescription-refill")
        .send({ fullName: "Anon Person", phoneNumber: ANON_PHONE });

      expect(response.status).toBe(201);

      const stored = await prisma.refillRequest.findFirstOrThrow({ where: { phoneNumber: ANON_PHONE } });
      expect(stored.userId).toBeNull();
    });

    it("links the request to the caller's account when a valid token is sent", async () => {
      const customer = await registerCustomer(CUSTOMER_EMAIL);

      const response = await request(app)
        .post("/api/prescription-refill")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({ fullName: "Logged In Person", phoneNumber: LINKED_PHONE });

      expect(response.status).toBe(201);

      const stored = await prisma.refillRequest.findFirstOrThrow({ where: { phoneNumber: LINKED_PHONE } });
      expect(stored.userId).toBe(customer.id);
    });
  });

  describe("GET /api/prescription-refill/mine", () => {
    it("requires authentication", async () => {
      const response = await request(app).get("/api/prescription-refill/mine");

      expect(response.status).toBe(401);
    });

    it("returns only the caller's own requests, not anyone else's", async () => {
      const customer = await registerCustomer(CUSTOMER_EMAIL);

      await request(app)
        .post("/api/prescription-refill")
        .set("Authorization", `Bearer ${customer.token}`)
        .send({ fullName: "Logged In Person", phoneNumber: LINKED_PHONE });
      await request(app)
        .post("/api/prescription-refill")
        .send({ fullName: "Anon Person", phoneNumber: ANON_PHONE });

      const response = await request(app)
        .get("/api/prescription-refill/mine")
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].phoneNumber).toBe(LINKED_PHONE);
    });
  });

  describe("GET /api/prescription-refill/admin/all", () => {
    it("still requires admin and still returns everything (regression check)", async () => {
      const adminToken = await loginAsAdmin();

      await request(app)
        .post("/api/prescription-refill")
        .send({ fullName: "Anon Person", phoneNumber: ANON_PHONE });

      const response = await request(app)
        .get("/api/prescription-refill/admin/all")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.some((r: { phoneNumber: string }) => r.phoneNumber === ANON_PHONE)).toBe(true);
    });
  });
});
