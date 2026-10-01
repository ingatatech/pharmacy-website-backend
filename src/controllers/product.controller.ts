import { Request, Response } from "express";
import * as productService from "../services/product.service";
import { parsePagination, setTotalCountHeader } from "../utils/pagination";
import { isNotFoundError } from "../db/errors";
import { CreateProductInput, UpdateProductInput } from "../validators/product.validator";

export async function list(req: Request, res: Response) {
  const categorySlug = req.query.category ? String(req.query.category) : undefined;

  const [products, total] = await productService.findPublished(categorySlug, parsePagination(req));

  setTotalCountHeader(res, total);
  res.json(products);
}

export async function listAllForAdmin(_req: Request, res: Response) {
  const products = await productService.findAll();
  res.json(products);
}

export async function search(req: Request, res: Response) {
  const q = req.query.q ? String(req.query.q) : "";

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required." });
  }

  const products = await productService.search(q);

  res.json(products);
}

export async function getBySlug(req: Request, res: Response) {
  const product = await productService.findPublishedBySlug(String(req.params.slug));

  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }

  res.json(product);
}

export async function create(req: Request<{}, unknown, CreateProductInput>, res: Response) {
  const product = await productService.create(req.body);

  res.status(201).json(product);
}

export async function update(req: Request<{ id: string }, unknown, UpdateProductInput>, res: Response) {
  try {
    const product = await productService.update(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Product not found." });
    }
    throw error;
  }
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    await productService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Product not found." });
    }
    throw error;
  }
}
