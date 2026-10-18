import { z } from "zod";

// Keep this list in sync with the UserRole type in src/types/index.ts.
// "customer" accounts normally come from self-registration (POST
// /api/auth/register), not from here.
export const userRoles = ["admin", "pharmacist_reviewer", "customer"] as const;
export type UserRole = (typeof userRoles)[number];

const fullName = z.string().trim().min(2, "Full name must be at least 2 characters.");
const email = z.email("A valid email address is required.");
const password = z.string().min(8, "Password must be at least 8 characters.");

// Roles an admin is allowed to hand out over this API. "admin" is deliberately
// absent: admins are created only by the seed:admin script, so no HTTP request
// can ever mint one or escalate an existing account to one.
const assignableRole = z.enum(["pharmacist_reviewer", "customer"]);

// Which branch a pharmacist_reviewer is responsible for. Nullable on purpose:
// admins oversee every branch and customers have no branch, and a pharmacist
// can be created before a branch is chosen. Sending null clears the assignment,
// which is how an admin moves a pharmacist to unassigned.
const locationId = z.uuid("Must be a valid branch id.").nullable().optional();

// Creating staff: only a pharmacist_reviewer. Sending any other role (notably
// "admin") is rejected with 400 by this schema.
export const createUserSchema = z
  .object({ fullName, email, password, role: z.literal("pharmacist_reviewer"), locationId })
  .strict();

// Updating staff: an admin may move an account between pharmacist_reviewer and
// customer (promote/demote). "admin" is not an allowed value here, so a role
// can never be changed *to* admin.
export const updateUserSchema = z
  .object({
    fullName: fullName.optional(),
    email: email.optional(),
    password: password.optional(),
    role: assignableRole.optional(),
    locationId: locationId.optional(),
  })
  .partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
