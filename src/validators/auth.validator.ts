import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.email("A valid email address is required."),
    password: z.string().min(1, "Password is required."),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

// Deliberately has no `role` field at all — not even an optional/ignored
// one. With .strict(), a request body that includes "role" is rejected
// outright (400 "Unrecognized key: role") rather than silently dropped, so
// there is no way for a self-registering caller to request anything other
// than the "customer" role the service always assigns.
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
    email: z.email("A valid email address is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
  })
  .strict();

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
