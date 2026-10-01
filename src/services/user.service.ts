import bcrypt from "bcrypt";
import { repo } from "../db/data-source";
import { User } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
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

/**
 * @see USER_READ — always read users through this, never USER_SELECT alone.
 */
export const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  createdAt: true,
  locationId: true,
  location: { id: true, branchName: true, slug: true },
} as const;

/**
 * The read options every user-facing query must use.
 *
 * `relations` is not optional and is not redundant with the nested `select`
 * above: in TypeORM a relation listed only inside `select` prunes its columns
 * but never issues the JOIN, so the relation comes back missing from the
 * result entirely. Naming both together makes that mistake unmakeable. The
 * nested `select` still does its job — it narrows the joined row to
 * id/branchName/slug rather than the branch's address, hours and coordinates.
 */
export const USER_READ = {
  select: USER_SELECT,
  relations: { location: true },
} as const;

/**
 * @param role when given, restricts the result to that one role. The admin
 * Pharmacists page uses this to list only pharmacist_reviewer accounts instead
 * of the mixed admin/reviewer/customer list the Users page shows.
 */
export async function findAll(role?: string) {
  return repo(User).find({
    ...USER_READ,
    where: role ? { role } : {},
    order: { createdAt: "DESC" },
  });
}

export async function findById(id: string) {
  return repo(User).findOne({ ...USER_READ, where: { id } });
}

export async function create(data: CreateUserInput) {
  const repository = repo(User);
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const saved = await repository.save(
    repository.create({
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      locationId: resolveLocationId(data.role, data.locationId),
      passwordHash,
    }),
  );

  // Re-read through USER_READ so the response carries the branch summary and
  // omits the hash, exactly as the old `create({ include })` did.
  return repository.findOneOrFail({ ...USER_READ, where: { id: saved.id } });
}

export async function update(id: string, data: UpdateUserInput) {
  const repository = repo(User);
  const { password, ...rest } = data;

  // Read first so the branch rule can use the *effective* role. Without this,
  // sending { locationId } on its own to an account that isn't a pharmacist
  // would store a branch that no query would ever read, and demoting someone
  // without restating their branch would silently keep it.
  const existing = await repository.findOneOrFail({ where: { id }, select: { role: true } });
  const effectiveRole = data.role ?? existing.role;

  await updateOrFail(repository, id, {
    ...rest,
    // Spelled out rather than left in `...rest` so that omitting the key
    // means "leave the branch alone", while an explicit null (which the
    // validator allows) clears it.
    ...(data.locationId !== undefined || !BRANCH_ROLES.has(effectiveRole)
      ? { locationId: resolveLocationId(effectiveRole, data.locationId) }
      : {}),
    ...(password ? { passwordHash: await bcrypt.hash(password, SALT_ROUNDS) } : {}),
  });

  // Re-read rather than trusting update()'s return value: an
  // UPDATE ... RETURNING only gives back the columns it wrote, so the
  // `location` branch summary would be missing from the response.
  return repository.findOneOrFail({ ...USER_READ, where: { id } });
}

export async function remove(id: string) {
  await deleteOrFail(repo(User), id);
}