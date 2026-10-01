import { repo } from "../db/data-source";
import { Category } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
import { CategoryType } from "../types";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/category.validator";

export async function findAll(type: CategoryType | undefined) {
  return repo(Category).find({
    where: type ? { type } : {},
    order: { name: "ASC" },
  });
}

export async function findBySlug(slug: string) {
  return repo(Category).findOne({ where: { slug } });
}

export async function create(data: CreateCategoryInput) {
  const repository = repo(Category);
  return repository.save(repository.create(data));
}

export async function update(id: string, data: UpdateCategoryInput) {
  return updateOrFail(repo(Category), id, data);
}

export async function remove(id: string) {
  await deleteOrFail(repo(Category), id);
}