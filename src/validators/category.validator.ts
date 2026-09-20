import { z } from "zod";
import { requiredString } from "./common.validator";

export const createCategorySchema = z
  .object({
    name: requiredString("Name"),
    slug: requiredString("Slug"),
    type: z.enum(["service", "product"]),
  })
  .strict();

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
