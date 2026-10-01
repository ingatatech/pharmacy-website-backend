import { repo } from "../db/data-source";
import { Service } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
import { PaginationOptions } from "../utils/pagination";
import {
  CreateServiceInput,
  UpdateServiceInput,
} from "../validators/service.validator";

export async function findPublished(pagination: PaginationOptions) {
  const where = { isPublished: true };

  return Promise.all([
    repo(Service).find({
      where,
      relations: { category: true },
      take: pagination.take,
      skip: pagination.skip,
    }),
    repo(Service).count({ where }),
  ]);
}

export async function findPublishedBySlug(slug: string) {
  return repo(Service).findOne({
    where: { slug, isPublished: true },
    relations: { category: true },
  });
}

// Unfiltered — includes drafts (isPublished: false) — for the admin
// dashboard, which needs to list and edit services before they go live.
export async function findAll() {
  return repo(Service).find({
    relations: { category: true },
    order: { createdAt: "DESC" },
  });
}

export async function create(data: CreateServiceInput) {
  const repository = repo(Service);
  return repository.save(repository.create(data));
}

export async function update(id: string, data: UpdateServiceInput) {
  return updateOrFail(repo(Service), id, data);
}

export async function remove(id: string) {
  await deleteOrFail(repo(Service), id);
}