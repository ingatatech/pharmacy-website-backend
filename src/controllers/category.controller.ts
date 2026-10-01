import { Request, Response } from "express";
import * as categoryService from "../services/category.service";
import { isNotFoundError } from "../db/errors";
import { CategoryType } from "../types";
import { CreateCategoryInput, UpdateCategoryInput } from "../validators/category.validator";

export async function list(req: Request, res: Response) {
  const type = req.query.type ? (String(req.query.type) as CategoryType) : undefined;

  const categories = await categoryService.findAll(type);

  res.json(categories);
}

export async function getBySlug(req: Request, res: Response) {
  const category = await categoryService.findBySlug(String(req.params.slug));

  if (!category) {
    return res.status(404).json({ error: "Category not found." });
  }

  res.json(category);
}

export async function create(req: Request<{}, unknown, CreateCategoryInput>, res: Response) {
  const category = await categoryService.create(req.body);

  res.status(201).json(category);
}

export async function update(req: Request<{ id: string }, unknown, UpdateCategoryInput>, res: Response) {
  try {
    const category = await categoryService.update(req.params.id, req.body);
    res.json(category);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Category not found." });
    }
    throw error;
  }
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    await categoryService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Category not found." });
    }
    throw error;
  }
}
