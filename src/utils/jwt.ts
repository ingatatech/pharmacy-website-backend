import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN_SECONDS = 8 * 60 * 60; // 8 hours

export interface AuthTokenPayload {
  userId: string;
  role: string;
  locationId?: string | null;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  return secret;
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, getSecret(), {
    expiresIn: JWT_EXPIRES_IN_SECONDS,
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getSecret());
  return decoded as AuthTokenPayload;
}
