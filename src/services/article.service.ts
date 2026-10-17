import { repo } from "../db/data-source";
import { Article } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
import { PaginationOptions } from "../utils/pagination";
import {
  CreateArticleInput,
  UpdateArticleInput,
} from "../validators/article.validator";

/**
 * Every article handed back to a client must carry author/reviewer. The
 * frontend `Article` type declares both, and the admin form renders
 * `article.author.fullName` directly from a mutation response; a bare update
 * omits the relations, so publishing or saving replaced the loaded article with
 * one missing `author` and crashed the admin on the next render. Declared once
 * here so the finders and the mutations cannot drift apart again.
 */
const WITH_PEOPLE = { author: true, reviewer: true } as const;

export async function findPublished(pagination: PaginationOptions) {
  const where = { status: "published" };

  return Promise.all([
    repo(Article).find({
      where,
      relations: WITH_PEOPLE,
      order: { publishedAt: "DESC" },
      take: pagination.take,
      skip: pagination.skip,
    }),
    repo(Article).count({ where }),
  ]);
}

export async function findAllForAdmin() {
  return repo(Article).find({
    relations: WITH_PEOPLE,
    order: { createdAt: "DESC" },
  });
}

export async function findPublishedBySlug(slug: string) {
  return repo(Article).findOne({
    where: { slug, status: "published" },
    relations: WITH_PEOPLE,
  });
}

export async function findById(id: string) {
  return repo(Article).findOne({ where: { id } });
}

export async function create(data: CreateArticleInput, authorId: string) {
  const repository = repo(Article);
  const saved = await repository.save(
    repository.create({ ...data, status: "draft", authorId }),
  );
  return repository.findOneOrFail({
    where: { id: saved.id },
    relations: WITH_PEOPLE,
  });
}

export async function update(id: string, data: UpdateArticleInput) {
  return updateOrFail(repo(Article), id, data, { relations: WITH_PEOPLE });
}

export async function submitForReview(id: string) {
  return updateOrFail(repo(Article), id, { status: "pending_review" }, {
    relations: WITH_PEOPLE,
  });
}

export async function approve(id: string, reviewerId: string) {
  return updateOrFail(
    repo(Article),
    id,
    {
      status: "approved",
      reviewerId,
      lastReviewedAt: new Date(),
    },
    { relations: WITH_PEOPLE },
  );
}

export async function reject(id: string) {
  return updateOrFail(
    repo(Article),
    id,
    { status: "draft", lastReviewedAt: new Date() },
    { relations: WITH_PEOPLE },
  );
}

export async function publish(id: string) {
  return updateOrFail(
    repo(Article),
    id,
    { status: "published", publishedAt: new Date() },
    { relations: WITH_PEOPLE },
  );
}

export async function remove(id: string) {
  await deleteOrFail(repo(Article), id);
}
