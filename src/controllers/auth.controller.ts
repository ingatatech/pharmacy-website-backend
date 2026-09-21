import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { LoginInput, RegisterInput } from "../validators/auth.validator";

export async function register(req: Request<{}, unknown, RegisterInput>, res: Response) {
  const result = await authService.register(req.body);

  res.status(201).json({
    token: result.token,
    user: {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
    },
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
    user: {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
    },
  });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getUserById(req.user!.userId);

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
}
