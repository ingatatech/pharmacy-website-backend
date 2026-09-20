import { prisma } from "../prisma";
import { PaginationOptions } from "../utils/pagination";

export async function findAll(pagination: PaginationOptions) {
  return Promise.all([
    prisma.auditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      ...pagination,
    }),
    prisma.auditLog.count(),
  ]);
}

export async function record(actorId: string, method: string, path: string, statusCode: number) {
  return prisma.auditLog.create({
    data: { actorId, method, path, statusCode },
  });
}
