import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { isNotFoundError } from "../utils/prisma-errors";
import { CreateUserInput, UpdateUserInput } from "../validators/user.validator";

// prisma.ts's global `omit: { user: { passwordHash: true } }` already keeps
// passwordHash out of everything these calls return, so there is nothing
// extra to strip here before sending the response.

export async function list(_req: Request, res: Response) {
  const users = await userService.findAll();

  res.json(users);
}

export async function create(req: Request<{}, unknown, CreateUserInput>, res: Response) {
  const user = await userService.create(req.body);

  res.status(201).json(user);
}

export async function update(req: Request<{ id: string }, unknown, UpdateUserInput>, res: Response) {
  const isSelf = req.params.id === req.user!.userId;

  if (isSelf && req.body.role && req.body.role !== "admin") {
    return res.status(400).json({ error: "You cannot change your own role." });
  }

  try {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "User not found." });
    }
    throw error;
  }
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  if (req.params.id === req.user!.userId) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  try {
    await userService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "User not found." });
    }
    throw error;
  }
}
