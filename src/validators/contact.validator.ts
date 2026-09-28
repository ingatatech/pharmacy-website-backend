import { z } from "zod";
import { optionalNullableString, requiredString } from "./common.validator";

export const contactInquiryTypes = ["general", "health", "product", "service"] as const;

export const createContactInquirySchema = z
  .object({
    fullName: requiredString("Full name"),
    phoneNumber: requiredString("Phone number"),
    email: z.email("A valid email address is required."),
    subject: optionalNullableString,
    inquiryType: z.enum(contactInquiryTypes).optional(),
    message: z.string().trim().min(5, "Message must be at least 5 characters long."),
    preferredContactMethod: optionalNullableString,
    preferredBranch: optionalNullableString,
    // Id of the branch chosen in the form's branch picker, so the enquiry
    // joins to a real branch and a pharmacist's branch filter can find it.
    // preferredBranch above is still stored as submitted; this just makes the
    // branch reliable to match on. Foreign-key checked by the DB (P2003 -> 409).
    locationId: z.uuid("Must be a valid branch id.").nullable().optional(),
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
