import { Writable } from "stream";
import readline from "readline";
import bcrypt from "bcrypt";
import { DataSource } from "typeorm";
import { dataSourceOptions } from "./db/data-source";
import { User } from "./db/entities";

// Defaults for local/dev use only. CHANGE THE PASSWORD in any shared or
// production environment — it is never a placeholder here, because the
// password is always supplied via ADMIN_PASSWORD or an interactive prompt.
const DEFAULT_EMAIL = "admin@ingata.com";
const DEFAULT_FULL_NAME = "Ingata Admin";
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;

/**
 * Reads a line from the terminal without echoing it, so a typed password never
 * appears on screen. Implemented by swapping readline's output for a stream
 * that discards everything written while the prompt is active.
 */
function promptHidden(query: string): Promise<string> {
  let muted = false;

  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) {
        process.stdout.write(chunk, encoding);
      }
      callback();
    },
  });

  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });

  output.write(query);
  muted = true;

  return new Promise((resolve) => {
    rl.question("", (answer) => {
      rl.close();
      muted = false;
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function seedAdmin() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Set it in your environment (or .env) before running seed:admin.",
    );
  }

  // Email and full name come from arguments: `npm run seed:admin -- <email> [fullName]`.
  const email = process.argv[2] || DEFAULT_EMAIL;
  const fullName = process.argv[3] || DEFAULT_FULL_NAME;

  // The password is deliberately NOT a command-line argument: arguments are
  // recorded in shell history and visible to other users via the process list,
  // which is exactly how a password should not be handled. It is read from the
  // ADMIN_PASSWORD environment variable, or prompted for interactively.
  let password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    password = await promptHidden(`Password for ${email}: `);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Admin password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  // Managed Postgres providers (Render included) require SSL for connections
  // coming from outside their network, while a local Docker Postgres does not
  // and would reject an SSL handshake. So SSL is enabled only when the target
  // host is not the local machine.
  const needsSsl = !isLocalHost(new URL(url).hostname);

  const dataSource = new DataSource({
    ...dataSourceOptions,
    url,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

  await dataSource.initialize();

  try {
    const users = dataSource.getRepository(User);
    const existing = await users.findOne({ where: { email } });

    // Never overwrite an existing account — this script's only job is to
    // create the very first admin, and silently resetting an admin's password
    // would be a serious surprise.
    if (existing) {
      console.log(`A user with email "${email}" already exists. No changes made.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await users.save(users.create({ email, passwordHash, fullName, role: "admin" }));

    console.log(`Admin user created: ${email}`);
  } finally {
    // Always close, so a failed seed can't leave the process hanging on an
    // open connection.
    await dataSource.destroy();
  }
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin user:", error instanceof Error ? error.message : error);
  process.exit(1);
});
