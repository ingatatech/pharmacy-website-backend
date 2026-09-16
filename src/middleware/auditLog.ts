import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { AuditLog } from "../entities/AuditLog";
import { User } from "../entities/User";

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

    const auditLogRepository = AppDataSource.getRepository(AuditLog);
    const entry = auditLogRepository.create({
      actor: { id: req.user.userId } as User,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
    });

    auditLogRepository.save(entry).catch((error) => {
      console.error("Failed to write audit log entry:", error);
    });
  });

  next();
}
