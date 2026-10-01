import { repo } from "../db/data-source";
import { Faq } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
import { CreateFaqInput, UpdateFaqInput } from "../validators/faq.validator";

export async function findPublished() {
  return repo(Faq).find({
    where: { isPublished: true },
    order: { displayOrder: "ASC" },
  });
}

// Unfiltered — includes unpublished FAQs — for the admin dashboard.
export async function findAll() {
  return repo(Faq).find({ order: { displayOrder: "ASC" } });
}

export async function create(data: CreateFaqInput) {
  const repository = repo(Faq);
  return repository.save(repository.create(data));
}

export async function update(id: string, data: UpdateFaqInput) {
  return updateOrFail(repo(Faq), id, data);
}

export async function remove(id: string) {
  await deleteOrFail(repo(Faq), id);
}