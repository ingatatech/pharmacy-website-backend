import { z } from "zod";
import { optionalNullableString, requiredString } from "./common.validator";

export const createServiceSchema = z
  .object({
    name: requiredString("Name"),
    slug: requiredString("Slug"),
    shortDescription: requiredString("Short description"),
    detailedDescription: optionalNullableString,
    imageUrl: optionalNullableString,
    keyBenefit: optionalNullableString,
    intendedCustomers: optionalNullableString,
    requirements: optionalNullableString,
    process: optionalNullableString,
    limitations: optionalNullableString,
    categoryId: z.uuid().nullable().optional(),
    metaTitle: optionalNullableString,
    metaDescription: optionalNullableString,
    isPublished: z.boolean().optional(),
  })
  .strict();

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
