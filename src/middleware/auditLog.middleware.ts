import { Request, Response, NextFunction } from "express";
import * as auditLogService from "../services/audit-log.service";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

// Logs every successful staff mutation (create/update/delete) for admin
// accountability. Runs for all routes but only writes an entry once the
// response finishes, so it works regardless of where auth happens in a
// given route's middleware chain. Two cases are deliberately excluded:
// - Unauthenticated/public submissions (contact form, login, etc.), since
//   req.user is unset.
// - A logged-in *customer* submitting a public form (contact/refill routes
//   use optionalAuthenticate, so req.user CAN be set there) — this log is
//   for staff accountability, not routine customer activity, and logging it
//   would also mean AuditLog.actorId's foreign key (intentionally
//   protective of staff history) permanently blocks deleting any customer
//   who ever submitted a form while logged in.
export function auditLog(req: Request, res: Response, next: NextFunction) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  res.on("finish", () => {
    if (!req.user || req.user.role === "customer" || res.statusCode >= 400) {
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
