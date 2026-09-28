import { z } from "zod";
import { optionalNullableString, requiredString } from "./common.validator";

export const createRefillRequestSchema = z
  .object({
    fullName: requiredString("Full name"),
    phoneNumber: requiredString("Phone number"),
    email: z.email().nullable().optional(),
    preferredBranch: optionalNullableString,
    // Id of the branch chosen in the form's branch picker, so the row joins to
    // a real branch and a pharmacist's branch filter can find it. The name
    // above is still accepted and stored — this only makes the branch
    // reliable to match on. Foreign-key checked by the DB (P2003 -> 409).
    locationId: z.uuid("Must be a valid branch id.").nullable().optional(),
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
