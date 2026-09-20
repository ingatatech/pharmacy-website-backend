import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { CategoryType } from "../types";

export async function findAll(type: CategoryType | undefined) {
  const where: Prisma.CategoryWhereInput = {};
  if (type) {
    where.type = type;
  }

  return prisma.category.findMany({ where, orderBy: { name: "asc" } });
}

export async function create(data: Prisma.CategoryCreateInput) {
  return prisma.category.create({ data });
}

export async function update(id: string, data: Prisma.CategoryUpdateInput) {
  return prisma.category.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.category.delete({ where: { id } });
}
