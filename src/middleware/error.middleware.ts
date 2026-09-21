import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

// Prefers the classic `target` array (field names) when present, otherwise
// falls back to the driver adapter's nested `table` name.
function extractUniqueConflictTarget(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) {
    return null;
  }

  if (Array.isArray(meta.target)) {
    return meta.target.join(", ");
  }

  const adapterError = meta.driverAdapterError;
  if (adapterError && typeof adapterError === "object" && "cause" in adapterError) {
    const cause = (adapterError as { cause?: unknown }).cause;
    if (cause && typeof cause === "object" && "table" in cause) {
      const table = (cause as { table?: unknown }).table;
      if (typeof table === "string") {
        return table;
      }
    }
  }

  return null;
}

// Catch-all error handler. Without this, an error thrown in an async route
// handler (e.g. a Prisma unique-constraint violation on create) is an
// unhandled promise rejection under Express 4 — which doesn't just fail that
// one request, it crashes the whole Node process for every user.
// `express-async-errors` (imported once, first, in index.ts) is what routes
// those errors here at all; this is what turns them into a clean response.
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        // With the pg driver adapter, `meta.target` isn't populated the
        // classic way — the underlying Postgres error (and the affected
        // table) is nested under meta.driverAdapterError.cause instead.
        const target = extractUniqueConflictTarget(err.meta);
        return res.status(409).json({
          error: target ? `A ${target} with that value already exists.` : "A record with that value already exists.",
        });
      }
      case "P2025":
        return res.status(404).json({ error: "Resource not found." });
      case "P2003":
        return res
          .status(409)
          .json({ error: "This record is still referenced by other data and cannot be modified." });
      default:
        return res.status(400).json({ error: "Invalid request." });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: "Invalid request data." });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Please check the highlighted fields and try again.",
      details: err.issues,
    });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected error occurred." });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found." });
}
