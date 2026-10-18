import { describe, it, expect, afterEach } from "vitest";
import { repo } from "../src/db/data-source";
import { User } from "../src/db/entities";

const BAD_ROLE_EMAIL = "vitest-bad-role@ingata.test";

// The CHK_user_role constraint is added by migration
// 1792300000000-AddUserRoleCheckConstraint. `synchronize` is off, so the
// database itself is the source of truth here — these tests go through TypeORM
// only to reach the database, not to validate anything in JavaScript.
describe("user.role CHECK constraint (CHK_user_role)", () => {
  afterEach(async () => {
    await repo(User).delete({ email: BAD_ROLE_EMAIL });
  });

  it("rejects a role outside the allowed set", async () => {
    const badUser = repo(User).create({
      email: BAD_ROLE_EMAIL,
      fullName: "Bad Role",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcdefghi",
      role: "superuser" as User["role"],
    });

    await expect(repo(User).save(badUser)).rejects.toThrow(/CHK_user_role/);
  });

  it("accepts every role the application actually uses", async () => {
    for (const role of ["customer", "pharmacist_reviewer", "admin"] as const) {
      const user = repo(User).create({
        email: BAD_ROLE_EMAIL,
        fullName: "Good Role",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcdefghi",
        role,
      });

      await expect(repo(User).save(user)).resolves.toBeTruthy();
      await repo(User).delete({ email: BAD_ROLE_EMAIL });
    }
  });
});
