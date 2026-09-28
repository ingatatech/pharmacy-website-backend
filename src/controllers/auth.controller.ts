import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import * as userService from "../services/user.service";
import { LoginInput, RegisterInput, UpdateProfileInput } from "../validators/auth.validator";

// Whitelists rather than spreading the row, so a new column on User (e.g. the
// passwordHash login re-includes internally) can never reach a client by
// accident. locationId/location are included because a pharmacist's entire
// area is scoped to their branch, and having it in the login response lets the
// UI show their branch without a second round trip on every page load.
function toPublicUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: Date;
  locationId: string | null;
  location?: { id: string; branchName: string; slug: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
    locationId: user.locationId ?? null,
    location: user.location ?? null,
  };
}

export async function register(req: Request<{}, unknown, RegisterInput>, res: Response) {
  const result = await authService.register(req.body);

  res.status(201).json({
    token: result.token,
    user: toPublicUser(result.user),
  });
}

export async function login(req: Request<{}, unknown, LoginInput>, res: Response) {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  if (!result) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  res.json({
    token: result.token,
    user: toPublicUser(result.user),
  });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getUserById(req.user!.userId);

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  res.json(toPublicUser(user));
}

export async function updateMe(req: Request<{}, unknown, UpdateProfileInput>, res: Response) {
  const user = await userService.update(req.user!.userId, req.body);

  res.json(toPublicUser(user));
}
