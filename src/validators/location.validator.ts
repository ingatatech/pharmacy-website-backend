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

/**
 * What a pharmacist_reviewer may change about their *own* branch
 * (PATCH /api/pharmacist/branch).
 *
 * Written out field by field rather than derived from updateLocationSchema,
 * because the admin schema contains three fields a pharmacist must not be able
 * to set:
 *   - slug            — the branch's public URL; changing it breaks inbound links
 *                       and the branch page that is already published.
 *   - isActive        — taking the branch's public page offline is a
 *                       company-wide decision, not a local one.
 *   - availableServices — the catalogue the branch advertises.
 * `.strict()` means anything not listed here is rejected outright (400) rather
 * than quietly dropped, so a caller can't believe they changed something they
 * didn't.
 */
export const updateOwnBranchSchema = z
  .object({
    branchName: requiredString("Branch name"),
    address: requiredString("Address"),
    telephone: optionalNullableString,
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    openingHours: openingHoursSchema.nullable().optional(),
    description: optionalNullableString,
    photoUrl: optionalNullableString,
  })
  .strict()
  .partial();

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type UpdateOwnBranchInput = z.infer<typeof updateOwnBranchSchema>;
