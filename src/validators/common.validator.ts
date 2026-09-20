import { z } from "zod";

export const idParamSchema = z.object({
  id: z.uuid("Must be a valid id."),
});

export const slugParamSchema = z.object({
  slug: z.string().trim().min(1),
});

// A required, non-empty, trimmed string.
export const requiredString = (label: string) => z.string().trim().min(1, `${label} is required.`);

// An optional string field on a nullable DB column: omitting the key,
// sending null (to clear it), or sending a non-empty trimmed string are all
// valid; an empty string is not (callers should send null instead).
export const optionalNullableString = z.string().trim().min(1).nullable().optional();
