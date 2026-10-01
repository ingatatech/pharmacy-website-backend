import bcrypt from "bcrypt";
import { closeDb, initializeDb, repo } from "./db/data-source";
import { User } from "./db/entities";

// Placeholder credentials for local/dev use only.
// CHANGE THIS PASSWORD IMMEDIATELY in any shared or production environment.
const DEFAULT_EMAIL = "admin@ingata.com";
const DEFAULT_PASSWORD = "changeme123";

async function seedAdmin() {
  const email = process.argv[2] || DEFAULT_EMAIL;
  const password = process.argv[3] || DEFAULT_PASSWORD;
  const fullName = process.argv[4] || "Ingata Admin";

  await initializeDb();

  try {
    const users = repo(User);
    const existing = await users.findOne({ where: { email } });

    if (existing) {
      console.log(`A user with email "${email}" already exists. No changes made.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await users.save(users.create({ email, passwordHash, fullName, role: "admin" }));

    console.log(`Admin user created: ${email}`);
    if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
      console.log(
        "WARNING: default placeholder credentials were used. Change the password immediately."
      );
    }
  } finally {
    // Always close, so a failed seed can't leave the process hanging on an
    // open connection (which is what the old $disconnect calls were doing).
    await closeDb();
  }
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin user:", error);
  process.exit(1);
});