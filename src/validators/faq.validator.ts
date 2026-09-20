import { z } from "zod";
import { requiredString } from "./common.validator";

export const createFaqSchema = z
  .object({
    question: requiredString("Question"),
    answer: requiredString("Answer"),
    displayOrder: z.number().int().optional(),
    isPublished: z.boolean().optional(),
  })
  .strict();

export const updateFaqSchema = createFaqSchema.partial();

export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
