import {
  EntityNotFoundError,
  FindOneOptions,
  QueryDeepPartialEntity,
  QueryFailedError,
  Repository,
} from "typeorm";

/**
 * Thrown where a Prisma `update`/`delete` on a missing id would have thrown
 * P2025.
 *
 * This exists because the equivalent TypeORM call is silent: `repository.update`
 * and `repository.delete` affect zero rows and resolve normally, so an update
 * of a non-existent row would return 200 with an empty body instead of 404.
 * Every update/delete path must therefore check `affected` and call
 * `updateOrFail` / `deleteOrFail` below rather than the raw repository method.
 */
export class NotFoundError extends Error {
  constructor(message = "Resource not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof NotFoundError || error instanceof EntityNotFoundError;
}

interface PgDriverError {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
  schema?: string;
  column?: string;
}

/** Postgres SQLSTATE code, or null when the error didn't come from the driver. */
export function postgresErrorCode(error: unknown): string | null {
  if (!(error instanceof QueryFailedError)) {
    return null;
  }
  const driverError = error.driverError as PgDriverError | undefined;
  return driverError?.code ?? null;
}

export function driverError(error: unknown): PgDriverError | undefined {
  if (!(error instanceof QueryFailedError)) {
    return undefined;
  }
  return error.driverError as PgDriverError | undefined;
}

export function isUniqueViolation(error: unknown): boolean {
  return postgresErrorCode(error) === "23505";
}

export function isForeignKeyViolation(error: unknown): boolean {
  return postgresErrorCode(error) === "23503";
}

/**
 * Malformed input that Postgres itself rejects — most importantly a
 * non-UUID path/body value (`22P02`), which used to surface as a Prisma
 * validation error and must stay a 400 rather than becoming a 500.
 */
export function isInvalidInputError(error: unknown): boolean {
  const code = postgresErrorCode(error);
  return code === "22P02" || code === "22P03" || code === "23502" || code === "23514";
}

/**
 * Best-effort name for the columns a unique violation hit, so the 409 can say
 * "A user.email with that value already exists." Postgres reports this in
 * `detail` as `Key (email)=(a@b.c) already exists.`
 */
export function uniqueConflictTarget(error: unknown): string | null {
  const pg = driverError(error);
  const detail = pg?.detail;
  if (typeof detail === "string") {
    const match = /^Key \(([^)]+)\)=/.exec(detail);
    if (match) {
      return match[1].split(",").map((col) => col.trim()).join(", ");
    }
  }
  return pg?.table ?? null;
}

/**
 * A partial update as it arrives from a zod-validated request body.
 *
 * Deliberately more permissive than TypeORM's `QueryDeepPartialEntity`, which
 * rejects an explicit `null` even for a nullable column — so a PATCH that
 * clears e.g. `openingHours` could not be expressed. This mirrors the shape
 * Prisma's `UpdateInput` accepted, including its "leave the column alone when
 * the key is absent" behaviour.
 */
export type Updatable<T> = { [K in keyof T]?: T[K] | null };

/**
 * `update` that preserves Prisma's throw-on-missing-id behaviour.
 *
 * Prisma raised P2025 when the target row did not exist, which the controllers
 * turn into 404. TypeORM reports `affected: 0` and resolves, so without this
 * check every "update a deleted record" request would silently return 200.
 */
export async function updateOrFail<T extends { id: string }>(
  repository: Repository<T>,
  id: string,
  partial: Updatable<T>,
  findOptions?: FindOneOptions<T>,
): Promise<T> {
  const result = await repository.update(id, partial as QueryDeepPartialEntity<T>);
  if (!result.affected) {
    throw new NotFoundError();
  }
  const updated = findOptions
    ? await repository.findOne({ where: { id } as never, ...findOptions })
    : await repository.findOneBy({ id } as never);
  if (!updated) {
    throw new NotFoundError();
  }
  return updated;
}

/** `delete` counterpart of {@link updateOrFail}. */
export async function deleteOrFail<T extends { id: string }>(
  repository: Repository<T>,
  id: string,
): Promise<void> {
  const result = await repository.delete(id);
  if (!result.affected) {
    throw new NotFoundError();
  }
}