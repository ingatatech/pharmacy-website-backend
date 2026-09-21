import { z } from "zod";

// Keep this list in sync with the UserRole type in src/types/index.ts.
// "customer" accounts normally come from self-registration (POST
// /api/auth/register), not from here — but an admin can still use this
// endpoint to hand-create one, or to promote a customer to staff (or demote
// staff back to customer). This is the only place any account's role can
// change; a customer can never set or change their own.
const userRoles = ["admin", "pharmacist_reviewer", "customer"] as const;

const fullName = z.string().trim().min(2, "Full name must be at least 2 characters.");
const email = z.email("A valid email address is required.");
const password = z.string().min(8, "Password must be at least 8 characters.");
const role = z.enum(userRoles);

export const createUserSchema = z.object({ fullName, email, password, role }).strict();

export const updateUserSchema = z
  .object({
    fullName: fullName.optional(),
    email: email.optional(),
    password: password.optional(),
    role: role.optional(),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
