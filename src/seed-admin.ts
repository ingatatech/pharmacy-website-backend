import bcrypt from "bcrypt";
import { prisma } from "./prisma";

// Placeholder credentials for local/dev use only.
// CHANGE THIS PASSWORD IMMEDIATELY in any shared or production environment.
const DEFAULT_EMAIL = "admin@ingata.com";
const DEFAULT_PASSWORD = "changeme123";

async function seedAdmin() {
  const email = process.argv[2] || DEFAULT_EMAIL;
  const password = process.argv[3] || DEFAULT_PASSWORD;
  const fullName = process.argv[4] || "Ingata Admin";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`A user with email "${email}" already exists. No changes made.`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: "admin",
    },
  });

  console.log(`Admin user created: ${email}`);
  if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
    console.log("WARNING: default placeholder credentials were used. Change the password immediately.");
  }

  await prisma.$disconnect();
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin user:", error);
  process.exit(1);
});
