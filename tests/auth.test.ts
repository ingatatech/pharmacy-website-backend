import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { repo } from "../src/db/data-source";
import { User } from "../src/db/entities";
import { TEST_ADMIN } from "./helpers/fixtures";
import { loginAsAdmin } from "./helpers/auth";

const NEW_CUSTOMER_EMAIL = "vitest-new-customer@ingata.test";

describe("POST /api/auth/register", () => {
  afterEach(async () => {
    await repo(User).delete({ email: NEW_CUSTOMER_EMAIL });
  });

  it("creates a customer account and returns a token, without being asked to", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "New Customer",
      email: NEW_CUSTOMER_EMAIL,
      password: "customer-password123",
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: NEW_CUSTOMER_EMAIL,
      role: "customer",
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("stores the password hashed, never in plain text", async () => {
    const plainPassword = "customer-password123";
    const createResponse = await request(app).post("/api/auth/register").send({
      fullName: "New Customer",
      email: NEW_CUSTOMER_EMAIL,
      password: plainPassword,
    });

    // passwordHash is `select: false` on the entity, so reading it back for this
    // assertion is an explicit opt-in — which is itself part of what this test
    // proves: the column is not handed out by default, only when asked for.
    const stored = await repo(User).findOneOrFail({
      where: { id: createResponse.body.user.id },
      select: { id: true, passwordHash: true },
    });

    expect(stored.passwordHash).not.toBe(plainPassword);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("ignores a body-supplied role and still creates a plain customer", async () => {
    // registerSchema has no "role" field and strips unknown keys, so asking
    // for "admin" is silently ignored — the account is created as "customer".
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "New Customer",
        email: NEW_CUSTOMER_EMAIL,
        password: "customer-password123",
        role: "admin",
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe("customer");
  });

  it("rejects a duplicate email with 409", async () => {
    const payload = {
      fullName: "New Customer",
      email: NEW_CUSTOMER_EMAIL,
      password: "customer-password123",
    };
    const first = await request(app).post("/api/auth/register").send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/auth/register").send(payload);
    expect(second.status).toBe(409);
  });

  it("rejects a password shorter than 8 characters with 400", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "New Customer",
      email: NEW_CUSTOMER_EMAIL,
      password: "short",
    });

    expect(response.status).toBe(400);
  });

  it("rejects a missing full name with 400", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: NEW_CUSTOMER_EMAIL,
      password: "customer-password123",
    });

    expect(response.status).toBe(400);
  });

  it("a newly registered customer can immediately log in and use /me", async () => {
    await request(app).post("/api/auth/register").send({
      fullName: "New Customer",
      email: NEW_CUSTOMER_EMAIL,
      password: "customer-password123",
    });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: NEW_CUSTOMER_EMAIL, password: "customer-password123" });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.role).toBe("customer");

    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.role).toBe("customer");
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token and the user's public profile for valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: TEST_ADMIN.email,
      fullName: TEST_ADMIN.fullName,
      role: "admin",
    });
    // The response must never include the password hash.
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("rejects a wrong password with 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ADMIN.email, password: "wrong-password" });

    expect(response.status).toBe(401);
  });

  it("rejects a missing password with 400 (validation, not auth)", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: TEST_ADMIN.email });

    expect(response.status).toBe(400);
  });

  it("rejects a malformed email with 400", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "whatever123" });

    expect(response.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 without a token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  it("returns the caller's profile with a valid token", async () => {
    const token = await loginAsAdmin();

    const response = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(TEST_ADMIN.email);
  });
});
