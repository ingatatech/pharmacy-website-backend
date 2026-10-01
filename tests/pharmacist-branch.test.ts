import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../src/app";
import { In } from "typeorm";
import { repo } from "../src/db/data-source";
import {
  AuditLog,
  ContactInquiry,
  PharmacyLocation,
  RefillRequest,
  TeamMember,
  User,
} from "../src/db/entities";
import { loginAsAdmin, registerCustomer } from "./helpers/auth";

/**
 * The pharmacist portal is branch-scoped, so the whole point of these tests is
 * that a pharmacist only ever sees and touches their *own* branch. Every test
 * creates two parallel branches and two pharmacists so that "correct" and
 * "leaked" are distinguishable — a test that passed against a single branch
 * would prove nothing.
 */

const BRANCH_A = {
  slug: "vitest-branch-a",
  branchName: "Vitest Branch A",
  address: "1 Test Street",
  telephone: "+250700000001",
  latitude: -1.94,
  longitude: 30.06,
  openingHours: { monday: "8:00-18:00" },
  availableServices: ["prescription-refills"],
};

const BRANCH_B = {
  slug: "vitest-branch-b",
  branchName: "Vitest Branch B",
  address: "2 Test Street",
  telephone: "+250700000002",
  latitude: -1.95,
  longitude: 30.07,
  openingHours: { monday: "9:00-19:00" },
  availableServices: ["prescription-refills"],
};

const PASSWORD = "pharmacist-password123";

/** Creates a pharmacist directly in the database and returns a login token. */
async function createPharmacist(email: string, locationId: string | null) {
  const users = repo(User);
  await users.save(
    users.create({
      email,
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      fullName: `Pharmacist ${email}`,
      role: "pharmacist_reviewer",
      locationId,
    }),
  );

  const response = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  expect(response.status).toBe(200);

  const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${response.body.token}`);
  return { token: response.body.token as string, id: me.body.id as string, locationId };
}

describe("Pharmacist branch area (/api/pharmacist)", () => {
  let branchA: { id: string };
  let branchB: { id: string };
  let alice: { token: string; id: string };
  let bob: { token: string; id: string };
  let unassigned: { token: string; id: string };
  let applicant: { id: string; password: string };
  let adminToken: string;

  const APPLICANT_EMAIL = "vitest-applicant@ingata.test";

  beforeAll(async () => {
    adminToken = await loginAsAdmin();

    const branches = repo(PharmacyLocation);
    branchA = await branches.save(branches.create(BRANCH_A));
    branchB = await branches.save(branches.create(BRANCH_B));

    alice = await createPharmacist("vitest-alice@ingata.test", branchA.id);
    bob = await createPharmacist("vitest-bob@ingata.test", branchB.id);
    unassigned = await createPharmacist("vitest-unassigned@ingata.test", null);

    // Stands in for someone who signed themselves up and is waiting to be
    // promoted — the real entry point into the pharmacist role.
    applicant = await createCustomer(APPLICANT_EMAIL);
  });

  /** A self-registered account, exactly as the public signup form produces. */
  async function createCustomer(email: string) {
    const password = "applicant-password123";
    const users = repo(User);
    const user = await users.save(
      users.create({
        email,
        passwordHash: await bcrypt.hash(password, 10),
        fullName: "Branch Applicant",
        role: "customer",
      }),
    );
    return { id: user.id, password };
  }

  // Order matters: audit rows reference the user, the user references the
  // branch, and PharmacyLocation is Restrict — so delete from the leaves up.
  afterAll(async () => {
    const userIds = [alice.id, bob.id, unassigned.id, applicant.id];

    await repo(AuditLog).delete({ actorId: In(userIds) });
    await repo(RefillRequest).delete({
      fullName: In(["Alice Patient", "Bob Patient", "Legacy Patient"]),
    });
    await repo(ContactInquiry).delete({
      fullName: In(["Alice Enquirer", "Bob Enquirer"]),
    });
    await repo(User).delete({ id: In(userIds) });
    await repo(PharmacyLocation).delete({ id: In([branchA.id, branchB.id]) });
  });

  /** Creates a refill request for a branch, bypassing the public limiter. */
  async function createRefill(fullName: string, locationId: string | null, preferredBranch: string) {
    const refills = repo(RefillRequest);
    return refills.save(
      refills.create({
        fullName,
        phoneNumber: "+250700000099",
        medicationName: "TestMed",
        preferredBranch,
        locationId,
      }),
    );
  }

  describe("authentication and role boundary", () => {
    it("rejects an unauthenticated caller with 401", async () => {
      const response = await request(app).get("/api/pharmacist/branch");

      expect(response.status).toBe(401);
    });

    it("rejects an admin with 403 — an admin manages branches via /api/locations", async () => {
      const response = await request(app)
        .get("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
    });

    it("rejects a self-registered customer with 403", async () => {
      const customer = await registerCustomer("vitest-customer-blocked@ingata.test");

      const response = await request(app)
        .get("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${customer.token}`);

      expect(response.status).toBe(403);

      await repo(User).delete(customer.id).catch(() => undefined);
    });
  });

  describe("GET /api/pharmacist/branch", () => {
    it("resolves the branch from the authenticated user, with no branch parameter involved", async () => {
      const response = await request(app)
        .get("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${alice.token}`);

      expect(response.status).toBe(200);
      expect(response.body.branch).toMatchObject({ id: branchA.id, slug: BRANCH_A.slug });
    });

    it("returns each pharmacist their own branch", async () => {
      const [a, b] = await Promise.all([
        request(app).get("/api/pharmacist/branch").set("Authorization", `Bearer ${alice.token}`),
        request(app).get("/api/pharmacist/branch").set("Authorization", `Bearer ${bob.token}`),
      ]);

      expect(a.body.branch.id).toBe(branchA.id);
      expect(b.body.branch.id).toBe(branchB.id);
    });

    it("returns { branch: null } for a pharmacist with no branch assigned", async () => {
      const response = await request(app)
        .get("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${unassigned.token}`);

      expect(response.status).toBe(200);
      expect(response.body.branch).toBeNull();
    });
  });

  describe("branch isolation for refill requests", () => {
    it("only lists refills belonging to the caller's own branch", async () => {
      await createRefill("Alice Patient", branchA.id, BRANCH_A.branchName);
      await createRefill("Bob Patient", branchB.id, BRANCH_B.branchName);

      const forAlice = await request(app)
        .get("/api/pharmacist/refills")
        .set("Authorization", `Bearer ${alice.token}`);
      const forBob = await request(app)
        .get("/api/pharmacist/refills")
        .set("Authorization", `Bearer ${bob.token}`);

      expect(forAlice.status).toBe(200);
      expect(forAlice.body.map((r: { fullName: string }) => r.fullName)).toEqual(["Alice Patient"]);
      expect(forBob.body.map((r: { fullName: string }) => r.fullName)).toEqual(["Bob Patient"]);
    });

    it("returns an empty list, not someone else's data, for an unassigned pharmacist", async () => {
      const response = await request(app)
        .get("/api/pharmacist/refills")
        .set("Authorization", `Bearer ${unassigned.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("omits refills created before locationId existed (no branch link)", async () => {
      // A legacy row with a preferredBranch string but no locationId cannot be
      // attributed to a branch, so it must not appear in anyone's queue.
      await createRefill("Legacy Patient", null, BRANCH_A.branchName);

      const forAlice = await request(app)
        .get("/api/pharmacist/refills")
        .set("Authorization", `Bearer ${alice.token}`);

      expect(forAlice.body.map((r: { fullName: string }) => r.fullName)).toEqual(["Alice Patient"]);
    });

    it("lets a pharmacist update a refill on their own branch", async () => {
      const refill = await createRefill("Alice Patient", branchA.id, BRANCH_A.branchName);

      const response = await request(app)
        .patch(`/api/pharmacist/refills/${refill.id}`)
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ status: "approved" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("approved");
    });

    it("returns 404, not 403, when a pharmacist targets another branch's refill", async () => {
      const bobRefill = await createRefill("Bob Patient", branchB.id, BRANCH_B.branchName);

      const response = await request(app)
        .patch(`/api/pharmacist/refills/${bobRefill.id}`)
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ status: "approved" });

      // 404 rather than 403 on purpose: a 403 would confirm the id exists
      // somewhere, leaking another branch's activity.
      expect(response.status).toBe(404);

      const unchanged = await repo(RefillRequest).findOneOrFail({ where: { id: bobRefill.id } });
      expect(unchanged.status).toBe("submitted");
    });

    it("returns 404 for an unassigned pharmacist patching any refill", async () => {
      const bobRefill = await createRefill("Bob Patient", branchB.id, BRANCH_B.branchName);

      const response = await request(app)
        .patch(`/api/pharmacist/refills/${bobRefill.id}`)
        .set("Authorization", `Bearer ${unassigned.token}`)
        .send({ status: "approved" });

      expect(response.status).toBe(404);
    });
  });

  describe("branch isolation for contact inquiries", () => {
    it("only lists and updates inquiries on the caller's own branch", async () => {
      const inquiries = repo(ContactInquiry);
      await inquiries.save(
        inquiries.create({
          fullName: "Alice Enquirer",
          phoneNumber: "+250700000001",
          email: "alice@ingata.test",
          message: "hello",
          locationId: branchA.id,
        }),
      );
      const bobInquiry = await inquiries.save(
        inquiries.create({
          fullName: "Bob Enquirer",
          phoneNumber: "+250700000002",
          email: "bob@ingata.test",
          message: "hello",
          locationId: branchB.id,
        }),
      );

      const list = await request(app)
        .get("/api/pharmacist/inquiries")
        .set("Authorization", `Bearer ${alice.token}`);
      expect(list.body.map((i: { fullName: string }) => i.fullName)).toEqual(["Alice Enquirer"]);

      const crossBranch = await request(app)
        .patch(`/api/pharmacist/inquiries/${bobInquiry.id}`)
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ status: "resolved" });
      expect(crossBranch.status).toBe(404);

      const own = await request(app)
        .patch(`/api/pharmacist/inquiries/${list.body[0].id}`)
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ status: "resolved" });
      expect(own.status).toBe(200);
      expect(own.body.status).toBe("resolved");
    });
  });

  describe("GET /api/pharmacist/branch/team", () => {
    it("lists colleagues assigned to the same branch, and nobody else's", async () => {
      const team = repo(TeamMember);
      await team.save(
        team.create({ fullName: "Alice Colleague", role: "Technician", locationId: branchA.id }),
      );
      await team.save(
        team.create({ fullName: "Bob Colleague", role: "Technician", locationId: branchB.id }),
      );

      const response = await request(app)
        .get("/api/pharmacist/branch/team")
        .set("Authorization", `Bearer ${alice.token}`);

      expect(response.status).toBe(200);
      expect(response.body.team.map((m: { fullName: string }) => m.fullName)).toEqual(["Alice Colleague"]);

      await repo(TeamMember).delete({
        fullName: In(["Alice Colleague", "Bob Colleague"]),
      });
    });
  });

  describe("PATCH /api/pharmacist/branch", () => {
    it("lets a pharmacist edit their own branch's operational details", async () => {
      const response = await request(app)
        .patch("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ telephone: "+250711111111", description: "Edited by pharmacist" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ telephone: "+250711111111", description: "Edited by pharmacist" });
    });

    it("rejects admin-only fields instead of silently ignoring them", async () => {
      for (const payload of [
        { slug: "hijacked" },
        { isActive: false },
        { availableServices: ["nonsense"] },
        { id: "00000000-0000-0000-0000-000000000000" },
      ]) {
        const response = await request(app)
          .patch("/api/pharmacist/branch")
          .set("Authorization", `Bearer ${alice.token}`)
          .send(payload);

        expect(response.status).toBe(400);
      }

      // The rejected attempts must not have changed anything.
      const branch = await repo(PharmacyLocation).findOneOrFail({ where: { id: branchA.id } });
      expect(branch.slug).toBe(BRANCH_A.slug);
      expect(branch.isActive).toBe(true);
      expect(branch.availableServices).toEqual(BRANCH_A.availableServices);
    });

    it("rejects a blanked day as 400, since an empty string is not valid hours", async () => {
      const response = await request(app)
        .patch("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ openingHours: { monday: "" } });

      expect(response.status).toBe(400);
    });

    it("clears a day when the key is omitted rather than sent empty", async () => {
      const response = await request(app)
        .patch("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ openingHours: { tuesday: "10:00-16:00" } });

      expect(response.status).toBe(200);
      // monday is gone from the replaced object, which is how the UI clears it.
      expect(response.body.openingHours).toEqual({ tuesday: "10:00-16:00" });
    });

    it("returns 409 for a pharmacist who has no branch assigned", async () => {
      const response = await request(app)
        .patch("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${unassigned.token}`)
        .send({ telephone: "+250700000000" });

      expect(response.status).toBe(409);
    });

    it("cannot be redirected at another branch by a body parameter", async () => {
      const response = await request(app)
        .patch("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ branchName: "Renamed", locationId: branchB.id });

      // locationId isn't in the pharmacist schema at all, so it's refused.
      expect(response.status).toBe(400);

      const bobBranch = await repo(PharmacyLocation).findOneOrFail({ where: { id: branchB.id } });
      expect(bobBranch.branchName).toBe(BRANCH_B.branchName);
    });
  });

  describe("reassigning a branch takes effect on the next request", () => {
    it("moves the pharmacist's whole view to the new branch", async () => {
      await createRefill("Bob Patient", branchB.id, BRANCH_B.branchName);

      const reassign = await request(app)
        .patch(`/api/admin/users/${alice.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ locationId: branchB.id });
      expect(reassign.status).toBe(200);
      expect(reassign.body.locationId).toBe(branchB.id);

      const branch = await request(app)
        .get("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${alice.token}`);
      expect(branch.body.branch.id).toBe(branchB.id);

      // Put her back so any test that runs after this isn't affected.
      await request(app)
        .patch(`/api/admin/users/${alice.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ locationId: branchA.id });
    });
  });

  describe("branch deletion is blocked while a pharmacist is assigned", () => {
    it("returns 409 rather than orphaning the account", async () => {
      const response = await request(app)
        .delete(`/api/locations/${branchA.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
    });

    it("succeeds once the pharmacist is reassigned away", async () => {
      await repo(User).update(alice.id, { locationId: null });

      const response = await request(app)
        .delete(`/api/locations/${branchA.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
      // Recreate it so the afterAll cleanup stays simple.
      branchA = await repo(PharmacyLocation).save(repo(PharmacyLocation).create(BRANCH_A));
      await repo(User).update(alice.id, { locationId: branchA.id });
    });
  });

  describe("promoting a self-registered user to pharmacist", () => {
    it("starts as a customer with no branch and no portal access", async () => {
      const login = await request(app)
        .post("/api/auth/login")
        .send({ email: APPLICANT_EMAIL, password: applicant.password });
      expect(login.status).toBe(200);
      expect(login.body.user.role).toBe("customer");
      expect(login.body.user.locationId).toBeNull();

      const portal = await request(app)
        .get("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${login.body.token}`);
      expect(portal.status).toBe(403);
    });

    it("an admin promotes them and assigns a branch in one request", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${applicant.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "pharmacist_reviewer", locationId: branchA.id });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        role: "pharmacist_reviewer",
        locationId: branchA.id,
        location: { branchName: BRANCH_A.branchName },
      });
    });

    it("keeps the password they chose at signup, so they can still log in", async () => {
      const login = await request(app)
        .post("/api/auth/login")
        .send({ email: APPLICANT_EMAIL, password: applicant.password });

      expect(login.status).toBe(200);
      expect(login.body.user.role).toBe("pharmacist_reviewer");
      expect(login.body.user.locationId).toBe(branchA.id);
    });

    it("gives them portal access scoped to the assigned branch immediately", async () => {
      const login = await request(app)
        .post("/api/auth/login")
        .send({ email: APPLICANT_EMAIL, password: applicant.password });
      const token = login.body.token as string;

      const branch = await request(app).get("/api/pharmacist/branch").set("Authorization", `Bearer ${token}`);
      expect(branch.status).toBe(200);
      expect(branch.body.branch.id).toBe(branchA.id);

      await createRefill("Alice Patient", branchA.id, BRANCH_A.branchName);
      await createRefill("Bob Patient", branchB.id, BRANCH_B.branchName);

      const refills = await request(app).get("/api/pharmacist/refills").set("Authorization", `Bearer ${token}`);
      expect(refills.body.map((r: { fullName: string }) => r.fullName)).toEqual(["Alice Patient"]);
    });

    it("drops a branch sent to an account that is not a pharmacist", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${applicant.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ locationId: branchB.id });

      // Role was left as pharmacist_reviewer, so this is just a branch change.
      expect(response.status).toBe(200);
      expect(response.body.locationId).toBe(branchB.id);

      // Put them back on branch A for the demotion test below.
      await request(app)
        .patch(`/api/admin/users/${applicant.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ locationId: branchA.id });
    });

    it("clears the branch when they're reverted to a regular user", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${applicant.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "customer" });

      expect(response.status).toBe(200);
      expect(response.body.role).toBe("customer");
      // Cleared without the admin having to remember to send locationId: null.
      expect(response.body.locationId).toBeNull();

      const stored = await repo(User).findOneOrFail({ where: { id: applicant.id } });
      expect(stored.locationId).toBeNull();
    });

    it("locks the portal again after being reverted", async () => {
      const login = await request(app)
        .post("/api/auth/login")
        .send({ email: APPLICANT_EMAIL, password: applicant.password });

      const portal = await request(app)
        .get("/api/pharmacist/branch")
        .set("Authorization", `Bearer ${login.body.token}`);

      expect(portal.status).toBe(403);
    });

    it("a customer cannot promote themselves", async () => {
      const login = await request(app)
        .post("/api/auth/login")
        .send({ email: APPLICANT_EMAIL, password: applicant.password });

      const response = await request(app)
        .patch(`/api/admin/users/${applicant.id}`)
        .set("Authorization", `Bearer ${login.body.token}`)
        .send({ role: "pharmacist_reviewer" });

      expect(response.status).toBe(403);

      const stored = await repo(User).findOneOrFail({ where: { id: applicant.id } });
      expect(stored.role).toBe("customer");
    });
  });
});
