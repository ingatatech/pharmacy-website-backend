import { Request, Response } from "express";
import * as faqService from "../services/faq.service";
import { isNotFoundError } from "../db/errors";
import { CreateFaqInput, UpdateFaqInput } from "../validators/faq.validator";

export async function list(_req: Request, res: Response) {
  const faqs = await faqService.findPublished();

  res.json(faqs);
}

export async function listAllForAdmin(_req: Request, res: Response) {
  const faqs = await faqService.findAll();
  res.json(faqs);
}

export async function create(req: Request<{}, unknown, CreateFaqInput>, res: Response) {
  const faq = await faqService.create(req.body);

  res.status(201).json(faq);
}

export async function update(req: Request<{ id: string }, unknown, UpdateFaqInput>, res: Response) {
  try {
    const faq = await faqService.update(req.params.id, req.body);
    res.json(faq);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "FAQ not found." });
    }
    throw error;
  }
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    await faqService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "FAQ not found." });
    }
    throw error;
  }
}
