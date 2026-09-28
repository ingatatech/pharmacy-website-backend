import { prisma } from "../prisma";
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { locationId: true, location: true },
  });

  return user?.location ?? null;
}

export async function findTeamForBranch(locationId: string) {
  return prisma.teamMember.findMany({
    where: { locationId },
    orderBy: { displayOrder: "asc" },
  });
}

// Below, the branch is part of the WHERE clause rather than something applied
// after the fetch. That is what makes the update endpoints safe: a pharmacist
// who PATCHes a request id belonging to another branch matches no row and gets
// 404, instead of being able to reach it by guessing ids.

export async function findRefillsForBranch(locationId: string, pagination: PaginationOptions) {
  return Promise.all([
    prisma.refillRequest.findMany({
      where: { locationId },
      orderBy: { createdAt: "desc" },
      ...pagination,
    }),
    prisma.refillRequest.count({ where: { locationId } }),
  ]);
}

export async function updateRefillForBranch(
  id: string,
  locationId: string,
  data: UpdateRefillRequestInput
) {
  const existing = await prisma.refillRequest.findFirst({ where: { id, locationId } });

  if (!existing) {
    return null;
  }

  return prisma.refillRequest.update({ where: { id }, data });
}

export async function findInquiriesForBranch(locationId: string, pagination: PaginationOptions) {
  return Promise.all([
    prisma.contactInquiry.findMany({
      where: { locationId },
      orderBy: { createdAt: "desc" },
      ...pagination,
    }),
    prisma.contactInquiry.count({ where: { locationId } }),
  ]);
}

export async function updateInquiryForBranch(
  id: string,
  locationId: string,
  data: UpdateContactInquiryInput
) {
  const existing = await prisma.contactInquiry.findFirst({ where: { id, locationId } });

  if (!existing) {
    return null;
  }

  return prisma.contactInquiry.update({ where: { id }, data });
}
