import { z } from "zod";
import { requiredString, optionalNullableString } from "./common.validator";

export const createTeamMemberSchema = z
  .object({
    fullName: requiredString("Full name"),
    role: requiredString("Role"),
    credentials: optionalNullableString,
    bio: optionalNullableString,
    photoUrl: optionalNullableString,
    displayOrder: z.number().int().optional(),
    isPublished: z.boolean().optional(),
    locationId: z.uuid().nullable().optional(),
  })
  .strict();

export const updateTeamMemberSchema = createTeamMemberSchema.partial();

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
