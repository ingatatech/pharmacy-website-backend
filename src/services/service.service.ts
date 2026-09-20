import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { PaginationOptions } from "../utils/pagination";

export async function findPublished(pagination: PaginationOptions) {
  return Promise.all([
    prisma.service.findMany({
      where: { isPublished: true },
      include: { category: true },
      ...pagination,
    }),
    prisma.service.count({ where: { isPublished: true } }),
  ]);
}

export async function findPublishedBySlug(slug: string) {
  return prisma.service.findFirst({
    where: { slug, isPublished: true },
    include: { category: true },
  });
}

export async function create(data: Prisma.ServiceCreateInput) {
  return prisma.service.create({ data });
}

export async function update(id: string, data: Prisma.ServiceUpdateInput) {
  return prisma.service.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.service.delete({ where: { id } });
}
