import { z } from "zod";
import { requiredString, optionalNullableString } from "./common.validator";

export const createTestimonialSchema = z
  .object({
    customerName: requiredString("Customer name"),
    customerCategory: optionalNullableString,
    testimonialText: requiredString("Testimonial text"),
    photoUrl: optionalNullableString,
    starRating: z.number().int().min(1).max(5).optional(),
    displayOrder: z.number().int().optional(),
    isPublished: z.boolean().optional(),
  })
  .strict();

export const updateTestimonialSchema = createTestimonialSchema.partial();

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
