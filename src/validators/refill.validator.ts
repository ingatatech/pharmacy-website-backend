import { z } from "zod";
import { optionalNullableString, requiredString } from "./common.validator";

export const createRefillRequestSchema = z
  .object({
    fullName: requiredString("Full name"),
    phoneNumber: requiredString("Phone number"),
    email: z.email().nullable().optional(),
    preferredBranch: optionalNullableString,
    prescriptionReference: optionalNullableString,
    medicationName: optionalNullableString,
    additionalNotes: optionalNullableString,
    preferredPickupMethod: optionalNullableString,
  })
  .strict();

export const updateRefillRequestSchema = z
  .object({
    status: z.enum(["submitted", "under_review", "approved", "rejected", "completed"]),
  })
  .strict()
  .partial();

export type CreateRefillRequestInput = z.infer<typeof createRefillRequestSchema>;
export type UpdateRefillRequestInput = z.infer<typeof updateRefillRequestSchema>;
