import { beforeAll, afterAll } from "vitest";
import bcrypt from "bcrypt";
import { closeDb, initializeDb, repo } from "../src/db/data-source";
import { User } from "../src/db/entities";
import { TEST_ADMIN, TEST_REVIEWER } from "./helpers/fixtures";

// Runs before every test file. Using upsert (not save) means running the suite
// multiple times against the same test database never fails with a
// "duplicate email" error - it just confirms the fixture users already match
// what's expected.
//
// Each vitest worker gets its own process, so every test file needs its own
// connection and its own teardown, exactly as the Prisma client did.
beforeAll(async () => {
  await initializeDb();
  const repository = repo(User);

  for (const user of [TEST_ADMIN, TEST_REVIEWER]) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const existing = await repository.findOne({ where: { email: user.email } });

    if (existing) {
      await repository.save({ ...existing, passwordHash, fullName: user.fullName, role: user.role });
    } else {
      await repository.save(repository.create({ email: user.email, passwordHash, fullName: user.fullName, role: user.role }));
    }
  }
});

afterAll(async () => {
  await closeDb();
});