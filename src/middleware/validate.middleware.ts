import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

// Validates req.body against `schema`, replacing it with the parsed (and
// therefore typed) result on success. On failure, returns the same
// { error, details } shape the contact/refill routes already used before
// this validation layer existed, so error handling stays consistent.
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Please check the highlighted fields and try again.",
        details: result.error.issues,
      });
    }

    req.body = result.data;
    next();
  };
}

// Validates req.params (e.g. a numeric/UUID :id) the same way.
export function validateParams(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request parameters.",
        details: result.error.issues,
      });
    }

    Object.assign(req.params, result.data);
    next();
  };
}
