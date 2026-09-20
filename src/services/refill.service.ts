import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { PaginationOptions } from "../utils/pagination";

export async function create(data: Prisma.RefillRequestCreateInput) {
  return prisma.refillRequest.create({ data });
}

export async function findAll(pagination: PaginationOptions) {
  return Promise.all([
    prisma.refillRequest.findMany({
      orderBy: { createdAt: "desc" },
      ...pagination,
    }),
    prisma.refillRequest.count(),
  ]);
}

export async function update(id: string, data: Prisma.RefillRequestUpdateInput) {
  return prisma.refillRequest.update({ where: { id }, data });
}
