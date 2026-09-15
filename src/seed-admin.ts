import "reflect-metadata";
import bcrypt from "bcrypt";
import { AppDataSource } from "./data-source";
import { User } from "./entities/User";

// Placeholder credentials for local/dev use only.
// CHANGE THIS PASSWORD IMMEDIATELY in any shared or production environment.
const DEFAULT_EMAIL = "admin@ingata.com";
const DEFAULT_PASSWORD = "changeme123";

async function seedAdmin() {
  const email = process.argv[2] || DEFAULT_EMAIL;
  const password = process.argv[3] || DEFAULT_PASSWORD;
  const fullName = process.argv[4] || "Ingata Admin";

  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const existing = await userRepository.findOne({ where: { email } });

  if (existing) {
    console.log(`A user with email "${email}" already exists. No changes made.`);
    await AppDataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = userRepository.create({
    email,
    passwordHash,
    fullName,
    role: "admin",
  });
  await userRepository.save(admin);

  console.log(`Admin user created: ${email}`);
  if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
    console.log("WARNING: default placeholder credentials were used. Change the password immediately.");
  }

  await AppDataSource.destroy();
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin user:", error);
  process.exit(1);
});
