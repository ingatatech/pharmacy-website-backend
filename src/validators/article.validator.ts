import { z } from "zod";
import { optionalNullableString, requiredString } from "./common.validator";

// status, authorId, reviewerId, publishedAt, and lastReviewedAt are
// deliberately excluded and therefore rejected by .strict() below — those
// are only ever changed by the dedicated workflow endpoints
// (submit-for-review/approve/reject/publish), never by a direct edit.
export const createArticleSchema = z
  .object({
    title: requiredString("Title"),
    slug: requiredString("Slug"),
    content: requiredString("Content"),
    featuredImageUrl: optionalNullableString,
    category: optionalNullableString,
    tags: z.array(z.string().trim().min(1)).optional(),
    metaTitle: optionalNullableString,
    metaDescription: optionalNullableString,
  })
  .strict();

export const updateArticleSchema = createArticleSchema.partial();

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
