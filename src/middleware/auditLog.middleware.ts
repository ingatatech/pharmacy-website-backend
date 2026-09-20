import { Request, Response, NextFunction } from "express";
import * as auditLogService from "../services/audit-log.service";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

// Logs every successful authenticated mutation (create/update/delete) for
// admin accountability. Runs for all routes but only writes an entry once
// the response finishes, so it works regardless of where auth happens in
// a given route's middleware chain, and unauthenticated/public submissions
// (contact form, login, etc.) are naturally excluded since req.user is unset.
export function auditLog(req: Request, res: Response, next: NextFunction) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  res.on("finish", () => {
    if (!req.user || res.statusCode >= 400) {
      return;
    }

    auditLogService
      .record(req.user.userId, req.method, req.originalUrl, res.statusCode)
      .catch((error) => {
        console.error("Failed to write audit log entry:", error);
      });
  });

  next();
}
