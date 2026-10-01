import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  isForeignKeyViolation,
  isInvalidInputError,
  isNotFoundError,
  isUniqueViolation,
  uniqueConflictTarget,
} from "../db/errors";

// Catch-all error handler. Without this, an error thrown in an async route
// handler (e.g. a unique-constraint violation on create) is an unhandled
// promise rejection under Express 4 — which doesn't just fail that one
// request, it crashes the whole Node process for every user.
// `express-async-errors` (imported once, first, in index.ts) is what routes
// those errors here at all; this is what turns them into a clean response.
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  if (isNotFoundError(err)) {
    return res.status(404).json({ error: "Resource not found." });
  }

  if (isUniqueViolation(err)) {
    const target = uniqueConflictTarget(err);
    return res.status(409).json({
      error: target
        ? `A ${target} with that value already exists.`
        : "A record with that value already exists.",
    });
  }

  if (isForeignKeyViolation(err)) {
    return res
      .status(409)
      .json({ error: "This record is still referenced by other data and cannot be modified." });
  }

  // Malformed UUIDs, over-length values and failed CHECK constraints are the
  // caller's fault, not ours — and are far more common than they look, since
  // every route param here is user-supplied.
  if (isInvalidInputError(err)) {
    return res.status(400).json({ error: "Invalid request." });
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