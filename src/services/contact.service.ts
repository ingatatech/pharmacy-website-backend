import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { PaginationOptions } from "../utils/pagination";

export async function create(data: Prisma.ContactInquiryCreateInput) {
  return prisma.contactInquiry.create({ data });
}

export async function findAll(pagination: PaginationOptions) {
  return Promise.all([
    prisma.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      ...pagination,
    }),
    prisma.contactInquiry.count(),
  ]);
}

export async function update(id: string, data: Prisma.ContactInquiryUpdateInput) {
  return prisma.contactInquiry.update({ where: { id }, data });
}
