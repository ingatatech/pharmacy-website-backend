import { Request, Response } from "express";
import * as serviceService from "../services/service.service";
import { parsePagination, setTotalCountHeader } from "../utils/pagination";
import { isNotFoundError } from "../utils/prisma-errors";
import { CreateServiceInput, UpdateServiceInput } from "../validators/service.validator";

export async function list(req: Request, res: Response) {
  const [services, total] = await serviceService.findPublished(parsePagination(req));

  setTotalCountHeader(res, total);
  res.json(services);
}

export async function getBySlug(req: Request, res: Response) {
  const service = await serviceService.findPublishedBySlug(String(req.params.slug));

  if (!service) {
    return res.status(404).json({ error: "Service not found." });
  }

  res.json(service);
}

export async function create(req: Request<{}, unknown, CreateServiceInput>, res: Response) {
  const service = await serviceService.create(req.body);

  res.status(201).json(service);
}

export async function update(req: Request<{ id: string }, unknown, UpdateServiceInput>, res: Response) {
  try {
    const service = await serviceService.update(req.params.id, req.body);
    res.json(service);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Service not found." });
    }
    throw error;
  }
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    await serviceService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Service not found." });
    }
    throw error;
  }
}
