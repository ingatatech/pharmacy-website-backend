import bcrypt from "bcrypt";
import { prisma } from "../prisma";
import { CreateUserInput, UpdateUserInput } from "../validators/user.validator";

const SALT_ROUNDS = 10;

// A branch assignment only means something for a pharmacist — it is what scopes
// their portal. Keeping it on a customer or admin would be misleading data that
// no query reads, so it is dropped rather than stored. This is enforced here,
// in the service, instead of in the validators, so every caller gets the same
// rule; the UI relies on it when demoting someone back to a customer.
const BRANCH_ROLES = new Set(["pharmacist_reviewer"]);

function resolveLocationId(role: string, locationId: string | null | undefined) {
  if (!BRANCH_ROLES.has(role)) return null;
  return locationId ?? null;
}

// The branch summary embedded on every user response. Deliberately narrow —
// id/branchName/slug is all either the admin Pharmacists table or the
// pharmacist's own header needs, and the full PharmacyLocation row (address,
// hours, coordinates) is fetched separately when actually needed.
//
// Written out at each call site rather than shared through a typed constant:
// this Prisma version's `Prisma.UserInclude` is a generic type, and referring
// to it without type arguments resolves every relation to `never`, which then
// fails to type-check against a real `include`. The repetition is the price of
// that; a shared const is not.

/**
 * @param role when given, restricts the result to that one role. The admin
 * Pharmacists page uses this to list only pharmacist_reviewer accounts instead
 * of the mixed admin/reviewer/customer list the Users page shows.
 */
export async function findAll(role?: string) {
  return prisma.user.findMany({
    include: { location: { select: { id: true, branchName: true, slug: true } } },
    where: role ? { role } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { location: { select: { id: true, branchName: true, slug: true } } },
  });
}

export async function create(data: CreateUserInput) {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      locationId: resolveLocationId(data.role, data.locationId),
      passwordHash,
    },
    include: { location: { select: { id: true, branchName: true, slug: true } } },
  });
}

export async function update(id: string, data: UpdateUserInput) {
  const { password, ...rest } = data;

  // Read first so the branch rule can use the *effective* role. Without this,
  // sending { locationId } on its own to an account that isn't a pharmacist
  // would store a branch that no query would ever read, and demoting someone
  // without restating their branch would silently keep it.
  const existing = await prisma.user.findUniqueOrThrow({ where: { id }, select: { role: true } });
  const effectiveRole = data.role ?? existing.role;

  return prisma.user.update({
    where: { id },
    data: {
      ...rest,
      // Spelled out rather than left in `...rest` so that omitting the key
      // means "leave the branch alone", while an explicit null (which the
      // validator allows) clears it.
      ...(data.locationId !== undefined || !BRANCH_ROLES.has(effectiveRole)
        ? { locationId: resolveLocationId(effectiveRole, data.locationId) }
        : {}),
      ...(password ? { passwordHash: await bcrypt.hash(password, SALT_ROUNDS) } : {}),
    },
    include: { location: { select: { id: true, branchName: true, slug: true } } },
  });
}

export async function remove(id: string) {
  return prisma.user.delete({ where: { id } });
}
