import { Request, Response } from "express";
import * as testimonialService from "../services/testimonial.service";
import { isNotFoundError } from "../db/errors";
import { CreateTestimonialInput, UpdateTestimonialInput } from "../validators/testimonial.validator";

export async function list(_req: Request, res: Response) {
  const testimonials = await testimonialService.findPublished();

  res.json(testimonials);
}

export async function listAllForAdmin(_req: Request, res: Response) {
  const testimonials = await testimonialService.findAll();
  res.json(testimonials);
}

export async function create(req: Request<{}, unknown, CreateTestimonialInput>, res: Response) {
  const testimonial = await testimonialService.create(req.body);

  res.status(201).json(testimonial);
}

export async function update(req: Request<{ id: string }, unknown, UpdateTestimonialInput>, res: Response) {
  try {
    const testimonial = await testimonialService.update(req.params.id, req.body);
    res.json(testimonial);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Testimonial not found." });
    }
    throw error;
  }
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    await testimonialService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Testimonial not found." });
    }
    throw error;
  }
}
