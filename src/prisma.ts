import * as dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Every query omits passwordHash by default (including nested `include:
// { author: true }` reads), so it can never leak in an API response by
// accident. Login explicitly re-includes it (`omit: { passwordHash: false }`)
// to verify the password.
export const prisma = new PrismaClient({
  adapter,
  omit: {
    user: {
      passwordHash: true,
    },
  },
});
