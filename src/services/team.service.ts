import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export async function findPublished() {
  return prisma.teamMember.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
  });
}

// Unfiltered — includes unpublished members — for the admin dashboard.
export async function findAll() {
  return prisma.teamMember.findMany({
    orderBy: { displayOrder: "asc" },
    include: { location: { select: { id: true, branchName: true } } },
  });
}

export async function create(data: Prisma.TeamMemberUncheckedCreateInput) {
  return prisma.teamMember.create({ data });
}

export async function update(id: string, data: Prisma.TeamMemberUncheckedUpdateInput) {
  return prisma.teamMember.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.teamMember.delete({ where: { id } });
}
