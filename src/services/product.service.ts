import { Brackets, FindOptionsWhere } from "typeorm";
import { repo } from "../db/data-source";
import { Product } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
import { PaginationOptions } from "../utils/pagination";
import {
  CreateProductInput,
  UpdateProductInput,
} from "../validators/product.validator";

export async function findPublished(
  categorySlug: string | undefined,
  pagination: PaginationOptions,
) {
  const where: FindOptionsWhere<Product> = { isPublished: true };
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  return Promise.all([
    repo(Product).find({
      where,
      relations: { category: true },
      // Newest first. Without an explicit order Postgres returns rows in
      // whatever order it happens to produce, so the catalog and the homepage
      // teaser could show a different set of products on every cache refresh.
      order: { createdAt: "DESC" },
      take: pagination.take,
      skip: pagination.skip,
    }),
    repo(Product).count({ where }),
  ]);
}

export async function search(query: string) {
  // Built with the query builder rather than a `where` object because TypeORM's
  // FindOptionsWhere is a mapped type over the entity's own keys and has no OR
  // support; Brackets gives the same grouping Prisma's OR array did.
  //
  // ILIKE, not LIKE: Prisma's `contains` with `mode: "insensitive"` was
  // case-insensitive, and plain LIKE would quietly make search stop matching
  // "aspirin" for a search of "Aspirin".
  return repo(Product)
    .createQueryBuilder("product")
    .leftJoinAndSelect("product.category", "category")
    .where("product.isPublished = true")
    .andWhere(
      new Brackets((qb) => {
        qb.where("product.name ILIKE :query", { query: `%${query}%` })
          .orWhere("product.brandName ILIKE :query", { query: `%${query}%` })
          .orWhere("product.activeIngredient ILIKE :query", { query: `%${query}%` });
      }),
    )
    .getMany();
}

export async function findPublishedBySlug(slug: string) {
  return repo(Product).findOne({
    where: { slug, isPublished: true },
    relations: { category: true },
  });
}

// Unfiltered — includes drafts (isPublished: false) — for the admin
// dashboard, which needs to list and edit products before they go live.
export async function findAll(locationId?: string) {
  const where = locationId ? { locationId } : {};
  return repo(Product).find({
    where,
    relations: { category: true },
    order: { createdAt: "DESC" },
  });
}

export async function create(data: CreateProductInput) {
  const repository = repo(Product);
  return repository.save(repository.create(data));
}

export async function update(id: string, data: UpdateProductInput) {
  return updateOrFail(repo(Product), id, data);
}

export async function remove(id: string) {
  await deleteOrFail(repo(Product), id);
}