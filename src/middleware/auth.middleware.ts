import { Request, Response, NextFunction } from "express";
import { verifyToken, AuthTokenPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Authentication required" });
  }
}

// For routes that stay public but behave differently for a logged-in caller
// (e.g. linking a contact/refill submission to the account that made it).
// Unlike `authenticate`, a missing or invalid token is not an error here —
// it just proceeds as anonymous. Never use this to gate access to
// anything; it only ever adds information, never removes a requirement.
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    try {
      req.user = verifyToken(token);
    } catch {
      // Invalid/expired token on an optional-auth route: ignore it and
      // continue as anonymous rather than failing the request.
    }
  }

  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }

    next();
  };
}
