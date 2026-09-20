import { Prisma } from "@prisma/client";

// Prisma's error code for "no record found" on update/delete/findUniqueOrThrow.
export function isNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
