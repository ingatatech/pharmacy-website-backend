import { repo } from "../db/data-source";
import { ContactInquiry, RefillRequest, TeamMember, User } from "../db/entities";
import { PaginationOptions } from "../utils/pagination";
import { UpdateRefillRequestInput } from "../validators/refill.validator";
import { UpdateContactInquiryInput } from "../validators/contact.validator";

/**
 * Resolves the branch a pharmacist is assigned to.
 *
 * The single most important rule in this file: the branch is always looked up
 * from the authenticated user's own `locationId`, never taken from a query
 * string or request body. Every pharmacist route goes through here, so there
 * is no request a client can craft that reads another branch's data.
 *
 * Read fresh from the database on each call rather than carried in the JWT, so
 * that an admin reassigning a pharmacist takes effect immediately instead of
 * after their token expires up to 8 hours later.
 *
 * Returns null when the account has no branch assigned yet (allowed — see the
 * nullable locationId on User), which the controller turns into an explicit
 * "unassigned" state rather than an error or, worse, an unscoped result set.
 */
export async function findBranchForUser(userId: string) {
  const user = await repo(User).findOne({
    where: { id: userId },
    relations: { location: true },
  });

  return user?.location ?? null;
}

export async function findTeamForBranch(locationId: string) {
  return repo(TeamMember).find({
    where: { locationId },
    order: { displayOrder: "ASC" },
  });
}

// Below, the branch is part of the WHERE clause rather than something applied
// after the fetch. That is what makes the update endpoints safe: a pharmacist
// who PATCHes a request id belonging to another branch matches no row and gets
// 404, instead of being able to reach it by guessing ids.
//
// The two update helpers below deliberately return null rather than throwing
// NotFoundError: their controller distinguishes "belongs to another branch"
// from "no branch assigned" with different response bodies, and both are 404s.
// Changing this to a throw would make the global handler own the body instead.

export async function findRefillsForBranch(
  locationId: string,
  pagination: PaginationOptions,
) {
  const where = { locationId };

  return Promise.all([
    repo(RefillRequest).find({
      where,
      order: { createdAt: "DESC" },
      take: pagination.take,
      skip: pagination.skip,
    }),
    repo(RefillRequest).count({ where }),
  ]);
}

export async function updateRefillForBranch(
  id: string,
  locationId: string,
  data: UpdateRefillRequestInput,
) {
  const repository = repo(RefillRequest);
  const existing = await repository.findOne({ where: { id, locationId } });

  if (!existing) {
    return null;
  }

  return repository.save(repository.merge(existing, data));
}

export async function findInquiriesForBranch(
  locationId: string,
  pagination: PaginationOptions,
) {
  const where = { locationId };

  return Promise.all([
    repo(ContactInquiry).find({
      where,
      order: { createdAt: "DESC" },
      take: pagination.take,
      skip: pagination.skip,
    }),
    repo(ContactInquiry).count({ where }),
  ]);
}

export async function updateInquiryForBranch(
  id: string,
  locationId: string,
  data: UpdateContactInquiryInput,
) {
  const repository = repo(ContactInquiry);
  const existing = await repository.findOne({ where: { id, locationId } });

  if (!existing) {
    return null;
  }

  return repository.save(repository.merge(existing, data));
}