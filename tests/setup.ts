import { beforeAll, afterAll } from "vitest";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma";
import { TEST_ADMIN, TEST_REVIEWER } from "./helpers/fixtures";

// Runs before every test file. Using upsert (not create) means running the
// suite multiple times against the same test database never fails with a
// "duplicate email" error — it just confirms the fixture users already
// match what's expected.
beforeAll(async () => {
  for (const user of [TEST_ADMIN, TEST_REVIEWER]) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, fullName: user.fullName, role: user.role },
      create: { email: user.email, passwordHash, fullName: user.fullName, role: user.role },
    });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
