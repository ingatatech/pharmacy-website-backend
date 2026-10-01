import { repo } from "../db/data-source";
import { TeamMember } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
import {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from "../validators/team.validator";

export async function findPublished() {
  return repo(TeamMember).find({
    where: { isPublished: true },
    order: { displayOrder: "ASC" },
  });
}

/**
 * Every team member column, plus the branch reduced to id/branchName.
 *
 * `relations` is required as well as the nested `select`: a relation named
 * only inside `select` never gets a JOIN in TypeORM and comes back missing.
 * Together they reproduce Prisma's `include: { location: { select: { id,
 * branchName } } }` exactly — all scalars, and deliberately *not* the branch's
 * address, telephone, coordinates or opening hours, which the team list has no
 * use for and which the public branch endpoint is the place to expose.
 */
const TEAM_WITH_BRANCH = {
  select: {
    id: true,
    fullName: true,
    role: true,
    credentials: true,
    bio: true,
    photoUrl: true,
    displayOrder: true,
    isPublished: true,
    createdAt: true,
    locationId: true,
    location: { id: true, branchName: true },
  },
  relations: { location: true },
} as const;

// Unfiltered — includes unpublished members — for the admin dashboard.
export async function findAll() {
  return repo(TeamMember).find({
    ...TEAM_WITH_BRANCH,
    order: { displayOrder: "ASC" },
  });
}

export async function create(data: CreateTeamMemberInput) {
  const repository = repo(TeamMember);
  return repository.save(repository.create(data));
}

export async function update(id: string, data: UpdateTeamMemberInput) {
  return updateOrFail(repo(TeamMember), id, data);
}

export async function remove(id: string) {
  await deleteOrFail(repo(TeamMember), id);
}