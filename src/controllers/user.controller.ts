import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { isNotFoundError } from "../db/errors";
import { CreateUserInput, UpdateUserInput } from "../validators/user.validator";

// No stripping is needed before sending a response: passwordHash is marked
// `select: false` on the User entity, so userService never returns it at all.
// See src/db/entities/user.entity.ts.

export async function list(req: Request, res: Response) {
  // ?role=pharmacist_reviewer backs the admin Pharmacists page. Anything else
  // is ignored rather than rejected, so this can't be used to probe for roles
  // that don't exist — it just returns no rows.
  const users = await userService.findAll(req.query.role as string | undefined);

  res.json(users);
}

export async function create(req: Request<{}, unknown, CreateUserInput>, res: Response) {
  const user = await userService.create(req.body);

  res.status(201).json(user);
}

export async function update(req: Request<{ id: string }, unknown, UpdateUserInput>, res: Response) {
  const target = await userService.findById(req.params.id);

  if (!target) {
    return res.status(404).json({ error: "User not found." });
  }

  const isSelf = req.params.id === req.user!.userId;

  if (isSelf && req.body.role !== undefined) {
    return res.status(400).json({ error: "You cannot change your own role." });
  }

  // No one may change an admin account's role — not another admin, and not the
  // account itself. Combined with updateUserSchema refusing to accept "admin",
  // this makes privilege escalation through this endpoint impossible: a role
  // can never become "admin", and an existing admin's role can never be
  // altered.
  if (target.role === "admin" && req.body.role !== undefined) {
    return res.status(400).json({ error: "An admin account's role cannot be changed." });
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

  const target = await userService.findById(req.params.id);

  if (!target) {
    return res.status(404).json({ error: "User not found." });
  }

  // Deleting the only admin would leave nobody able to manage staff. (An admin
  // deleting themselves is already blocked above, but this also covers the
  // case explicitly and is checked regardless of who the actor is.)
  if (target.role === "admin" && (await userService.countByRole("admin")) <= 1) {
    return res.status(400).json({ error: "You cannot delete the last admin account." });
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
