import { repo } from "../db/data-source";
import { PharmacistShift } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
import {
  CreatePharmacistShiftInput,
  UpdatePharmacistShiftInput,
} from "../validators/pharmacist-shift.validator";

/**
 * Public shape of a shift: enough to show who is on duty and where, and
 * deliberately not the team member's bio or the branch's phone/address — the
 * public team and location endpoints are the place for those.
 */
function toPublic(shift: PharmacistShift) {
  return {
    id: shift.id,
    dayOfWeek: shift.dayOfWeek,
    startTime: shift.startTime,
    endTime: shift.endTime,
    note: shift.note,
    teamMember: shift.teamMember
      ? {
          id: shift.teamMember.id,
          fullName: shift.teamMember.fullName,
          role: shift.teamMember.role,
          credentials: shift.teamMember.credentials,
          photoUrl: shift.teamMember.photoUrl,
        }
      : null,
    location: shift.location
      ? {
          id: shift.location.id,
          branchName: shift.location.branchName,
          slug: shift.location.slug,
        }
      : null,
  };
}

/**
 * Active shifts only, joined to a published team member and an active branch.
 * That combination is what keeps an unpublished profile or a closed branch out
 * of the public schedule without a second filtering pass in the UI.
 */
export async function findPublic(locationId?: string) {
  const shifts = await repo(PharmacistShift).find({
    where: {
      isActive: true,
      ...(locationId ? { locationId } : {}),
      teamMember: { isPublished: true },
      location: { isActive: true },
    },
    relations: { teamMember: true, location: true },
    order: { dayOfWeek: "ASC", startTime: "ASC" },
  });

  return shifts.map(toPublic);
}

export async function findAll() {
  return repo(PharmacistShift).find({
    relations: { teamMember: true, location: true },
    order: { dayOfWeek: "ASC", startTime: "ASC" },
  });
}

export async function findForBranch(locationId: string) {
  return repo(PharmacistShift).find({
    where: { locationId, isActive: true },
    relations: { teamMember: true, location: true },
    order: { dayOfWeek: "ASC", startTime: "ASC" },
  });
}

export async function create(data: CreatePharmacistShiftInput) {
  const repository = repo(PharmacistShift);
  return repository.save(repository.create(data));
}

export async function update(id: string, data: UpdatePharmacistShiftInput) {
  return updateOrFail(repo(PharmacistShift), id, data);
}

export async function remove(id: string) {
  await deleteOrFail(repo(PharmacistShift), id);
}
