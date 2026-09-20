import { Request, Response } from "express";
import * as locationService from "../services/location.service";
import { isNotFoundError } from "../utils/prisma-errors";
import { CreateLocationInput, UpdateLocationInput } from "../validators/location.validator";

export async function list(_req: Request, res: Response) {
  const locations = await locationService.findActive();

  res.json(locations);
}

export async function create(req: Request<{}, unknown, CreateLocationInput>, res: Response) {
  const location = await locationService.create(req.body);

  res.status(201).json(location);
}

export async function update(req: Request<{ id: string }, unknown, UpdateLocationInput>, res: Response) {
  try {
    const location = await locationService.update(req.params.id, req.body);
    res.json(location);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Pharmacy location not found." });
    }
    throw error;
  }
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    await locationService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Pharmacy location not found." });
    }
    throw error;
  }
}
