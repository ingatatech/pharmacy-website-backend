import { repo } from "../db/data-source";
import { AuditLog } from "../db/entities";
import { PaginationOptions } from "../utils/pagination";

export async function findAll(pagination: PaginationOptions) {
  return Promise.all([
    repo(AuditLog).find({
      relations: { actor: true },
      order: { createdAt: "DESC" },
      take: pagination.take,
      skip: pagination.skip,
    }),
    repo(AuditLog).count(),
  ]);
}

export async function record(
  actorId: string,
  method: string,
  path: string,
  statusCode: number,
) {
  const repository = repo(AuditLog);
  return repository.save(repository.create({ actorId, method, path, statusCode }));
}