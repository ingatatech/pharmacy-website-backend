import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.email("A valid email address is required."),
    password: z.string().min(1, "Password is required."),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

// Public self-registration. It has no `role` field, and unknown keys are
// stripped rather than rejected, so a body that includes "role": "admin" is
// simply ignored — the account is still created with the "customer" role the
// service assigns (see auth.service.ts). That is deliberate: the role is
// server-owned, and ignoring the field keeps a self-registering caller from
// probing which fields matter while guaranteeing they can never set anything
// but "customer".
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
    email: z.email("A valid email address is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
  })
  .strip();

export type RegisterInput = z.infer<typeof registerSchema>;

// Self-service profile update (PATCH /api/auth/me) — deliberately has no
// `role` field, unlike the admin-only updateUserSchema in user.validator.ts.
// A customer can never change their own role through this endpoint.
export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters.").optional(),
    email: z.email("A valid email address is required.").optional(),
    password: z.string().min(8, "Password must be at least 8 characters.").optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
