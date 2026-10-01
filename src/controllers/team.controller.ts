import { Request, Response } from "express";
import * as teamService from "../services/team.service";
import { isNotFoundError } from "../db/errors";
import { CreateTeamMemberInput, UpdateTeamMemberInput } from "../validators/team.validator";

export async function list(_req: Request, res: Response) {
  const members = await teamService.findPublished();

  res.json(members);
}

export async function listAllForAdmin(_req: Request, res: Response) {
  const members = await teamService.findAll();
  res.json(members);
}

export async function create(req: Request<{}, unknown, CreateTeamMemberInput>, res: Response) {
  const member = await teamService.create(req.body);

  res.status(201).json(member);
}

export async function update(req: Request<{ id: string }, unknown, UpdateTeamMemberInput>, res: Response) {
  try {
    const member = await teamService.update(req.params.id, req.body);
    res.json(member);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Team member not found." });
    }
    throw error;
  }
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    await teamService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Team member not found." });
    }
    throw error;
  }
}
