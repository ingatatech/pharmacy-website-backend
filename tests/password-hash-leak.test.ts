import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { loginAsAdmin } from "./helpers/auth";
import { TEST_ADMIN } from "./helpers/fixtures";

/**
 * The password hash is the one field that must never reach a client, and the
 * protection is a property of the *data layer*, not of any single handler:
 * `User.passwordHash` is declared `select: false`, so no repository call hands
 * it back unless a caller explicitly opts in with `passwordHash: true`. The one
 * place that does is the login lookup, which needs it to run bcrypt.compare.
 *
 * That makes this worth a test of its own. A handler that stopped going
 * through the service, or a relation loaded with `relations: { actor: true }`
 * where a differently-shaped select had been expected, would start leaking the
 * hash with no local change to any one file — which is exactly the kind of
 * regression that would not show up in the other suites.
 *
 * The endpoints chosen cover the three ways a User can reach a response:
 * a flat row (me, users list), a nested relation (an article's author), and a
 * relation loaded wholesale for a list (an audit entry's actor).
 */
describe("passwordHash never leaves the server", () => {
  it("is absent from the caller's own profile", async () => {
    const token = await loginAsAdmin();

    const response = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBeTruthy();
    expect(response.body).not.toHaveProperty("passwordHash");
  });

  it("is absent from every row of the admin users list", async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    for (const user of response.body) {
      expect(user).not.toHaveProperty("passwordHash");
    }
  });

  it("is absent from a nested relation (an article's author and reviewer)", async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get("/api/articles/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    for (const article of response.body) {
      for (const person of [article.author, article.reviewer]) {
        // reviewer is legitimately null until an article is approved.
        if (person) {
          expect(person).not.toHaveProperty("passwordHash");
        }
      }
    }
  });

  it("is absent from a wholesale-loaded relation (an audit entry's actor)", async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    for (const entry of response.body) {
      if (entry.actor) {
        expect(entry.actor).not.toHaveProperty("passwordHash");
      }
    }
  });

  it("is absent from the login response while still being readable for verification", async () => {
    // The response omits it...
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
    expect(login.body.user).not.toHaveProperty("passwordHash");

    // ...and logging in still works, which is only possible because the hash
    // was read from the database. Guards against "fixed" the leak by refusing
    // to ever load the column.
    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
  });
});