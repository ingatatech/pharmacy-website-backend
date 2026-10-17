import { z } from "zod";
import { optionalNullableString, requiredString } from "./common.validator";

export const createProductSchema = z
  .object({
    name: requiredString("Name"),
    slug: requiredString("Slug"),
    brandName: optionalNullableString,
    categoryId: z.uuid().nullable().optional(),
    generalDescription: optionalNullableString,
    generalUse: optionalNullableString,
    precautions: optionalNullableString,
    storageInformation: optionalNullableString,
    activeIngredient: optionalNullableString,
    formStrength: optionalNullableString,
    manufacturer: optionalNullableString,
    dosageInformation: optionalNullableString,
    requiresPrescription: z.boolean().optional(),
    availabilityStatus: z.enum(["in_stock", "out_of_stock", "unknown"]).optional(),
    imageUrl: optionalNullableString,
    metaTitle: optionalNullableString,
    metaDescription: optionalNullableString,
    isPublished: z.boolean().optional(),
    locationId: z.uuid().nullable().optional(),
  })
  .strict();

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
