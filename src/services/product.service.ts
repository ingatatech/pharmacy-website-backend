import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { PaginationOptions } from "../utils/pagination";

export async function findPublished(categorySlug: string | undefined, pagination: PaginationOptions) {
  const where: Prisma.ProductWhereInput = { isPublished: true };
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  return Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      ...pagination,
    }),
    prisma.product.count({ where }),
  ]);
}

export async function search(query: string) {
  return prisma.product.findMany({
    where: {
      isPublished: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { brandName: { contains: query, mode: "insensitive" } },
        { activeIngredient: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { category: true },
  });
}

export async function findPublishedBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isPublished: true },
    include: { category: true },
  });
}

// Unfiltered — includes drafts (isPublished: false) — for the admin
// dashboard, which needs to list and edit products before they go live.
export async function findAll() {
  return prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function create(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data });
}

export async function update(id: string, data: Prisma.ProductUpdateInput) {
  return prisma.product.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.product.delete({ where: { id } });
}
