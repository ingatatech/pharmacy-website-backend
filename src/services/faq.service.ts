import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export async function findPublished() {
  return prisma.faq.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function create(data: Prisma.FaqCreateInput) {
  return prisma.faq.create({ data });
}

export async function update(id: string, data: Prisma.FaqUpdateInput) {
  return prisma.faq.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.faq.delete({ where: { id } });
}
