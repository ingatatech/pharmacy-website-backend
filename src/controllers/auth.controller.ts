import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import * as userService from "../services/user.service";
import { LoginInput, RegisterInput, UpdateProfileInput } from "../validators/auth.validator";

function toPublicUser(user: { id: string; email: string; fullName: string; role: string; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
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
