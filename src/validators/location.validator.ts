import { z } from "zod";
import { optionalNullableString, requiredString } from "./common.validator";

const dayHours = z.string().trim().min(1).optional();

const openingHoursSchema = z
  .object({
    monday: dayHours,
    tuesday: dayHours,
    wednesday: dayHours,
    thursday: dayHours,
    friday: dayHours,
    saturday: dayHours,
    sunday: dayHours,
  })
  .strict();

export const createLocationSchema = z
  .object({
    slug: requiredString("Slug"),
    branchName: requiredString("Branch name"),
    address: requiredString("Address"),
    telephone: optionalNullableString,
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    openingHours: openingHoursSchema.nullable().optional(),
    availableServices: z.array(z.string().trim().min(1)).optional(),
    isActive: z.boolean().optional(),
    description: optionalNullableString,
    photoUrl: optionalNullableString,
  })
  .strict();

export const updateLocationSchema = createLocationSchema.partial();

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
