import { z } from "zod";
import { optionalNullableString, requiredString } from "./common.validator";

export const createContactInquirySchema = z
  .object({
    fullName: requiredString("Full name"),
    phoneNumber: requiredString("Phone number"),
    email: z.email("A valid email address is required."),
    subject: optionalNullableString,
    message: z.string().trim().min(5, "Message must be at least 5 characters long."),
    preferredContactMethod: optionalNullableString,
    preferredBranch: optionalNullableString,
  })
  .strict();

export const updateContactInquirySchema = z
  .object({
    status: z.enum(["new", "in_progress", "resolved"]),
  })
  .strict()
  .partial();

export type CreateContactInquiryInput = z.infer<typeof createContactInquirySchema>;
export type UpdateContactInquiryInput = z.infer<typeof updateContactInquirySchema>;
