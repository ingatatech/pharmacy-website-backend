import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export async function findPublished() {
  return prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
  });
}

// Unfiltered — includes unpublished testimonials — for the admin dashboard.
export async function findAll() {
  return prisma.testimonial.findMany({ orderBy: { displayOrder: "asc" } });
}

export async function create(data: Prisma.TestimonialCreateInput) {
  return prisma.testimonial.create({ data });
}

export async function update(id: string, data: Prisma.TestimonialUpdateInput) {
  return prisma.testimonial.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.testimonial.delete({ where: { id } });
}
