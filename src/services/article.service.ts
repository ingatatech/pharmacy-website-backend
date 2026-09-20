import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { PaginationOptions } from "../utils/pagination";

export async function findPublished(pagination: PaginationOptions) {
  return Promise.all([
    prisma.article.findMany({
      where: { status: "published" },
      include: { author: true },
      orderBy: { publishedAt: "desc" },
      ...pagination,
    }),
    prisma.article.count({ where: { status: "published" } }),
  ]);
}

export async function findAllForAdmin() {
  return prisma.article.findMany({
    include: { author: true, reviewer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function findPublishedBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, status: "published" },
    include: { author: true, reviewer: true },
  });
}

export async function findById(id: string) {
  return prisma.article.findUnique({ where: { id } });
}

export async function create(data: Omit<Prisma.ArticleUncheckedCreateInput, "status">, authorId: string) {
  return prisma.article.create({
    data: {
      ...data,
      status: "draft",
      authorId,
    },
  });
}

export async function update(id: string, data: Prisma.ArticleUpdateInput) {
  return prisma.article.update({ where: { id }, data });
}

export async function submitForReview(id: string) {
  return prisma.article.update({
    where: { id },
    data: { status: "pending_review" },
  });
}

export async function approve(id: string, reviewerId: string) {
  return prisma.article.update({
    where: { id },
    data: {
      status: "approved",
      reviewerId,
      lastReviewedAt: new Date(),
    },
  });
}

export async function reject(id: string) {
  return prisma.article.update({
    where: { id },
    data: {
      status: "draft",
      lastReviewedAt: new Date(),
    },
  });
}

export async function publish(id: string) {
  return prisma.article.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
  });
}
