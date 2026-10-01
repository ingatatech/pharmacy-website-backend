import { repo } from "../db/data-source";
import { Testimonial } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
import {
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from "../validators/testimonial.validator";

export async function findPublished() {
  return repo(Testimonial).find({
    where: { isPublished: true },
    order: { displayOrder: "ASC" },
  });
}

// Unfiltered — includes unpublished testimonials — for the admin dashboard.
export async function findAll() {
  return repo(Testimonial).find({ order: { displayOrder: "ASC" } });
}

export async function create(data: CreateTestimonialInput) {
  const repository = repo(Testimonial);
  return repository.save(repository.create(data));
}

export async function update(id: string, data: UpdateTestimonialInput) {
  return updateOrFail(repo(Testimonial), id, data);
}

export async function remove(id: string) {
  await deleteOrFail(repo(Testimonial), id);
}