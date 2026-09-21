import request from "supertest";
import { app } from "../../src/app";
import { TEST_ADMIN, TEST_REVIEWER } from "./fixtures";

async function login(email: string, password: string): Promise<string> {
  const response = await request(app).post("/api/auth/login").send({ email, password });

  if (response.status !== 200) {
    throw new Error(`Test login failed for ${email}: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return response.body.token as string;
}

export function loginAsAdmin() {
  return login(TEST_ADMIN.email, TEST_ADMIN.password);
}

export function loginAsReviewer() {
  return login(TEST_REVIEWER.email, TEST_REVIEWER.password);
}

// Registers a brand-new customer account and returns their id + token.
// Callers are responsible for deleting the user afterward (e.g. in
// afterEach) — this helper doesn't track or clean up what it creates.
export async function registerCustomer(email: string, password = "customer-password123") {
  const response = await request(app).post("/api/auth/register").send({
    fullName: "Test Customer",
    email,
    password,
  });

  if (response.status !== 201) {
    throw new Error(`Test registration failed for ${email}: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return { id: response.body.user.id as string, token: response.body.token as string };
}
