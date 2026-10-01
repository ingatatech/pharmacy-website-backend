import { Request, Response } from "express";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export interface PaginationOptions {
  take?: number;
  skip?: number;
}

/**
 * Parses optional "page"/"limit" query params into TypeORM take/skip.
 * Returns an empty object (no take/skip applied) when neither is given,
 * so existing callers that don't paginate keep getting the full list.
 */
export function parsePagination(req: Request): PaginationOptions {
  const rawPage = req.query.page ? Number(req.query.page) : undefined;
  const rawLimit = req.query.limit ? Number(req.query.limit) : undefined;

  if (!rawPage && !rawLimit) {
    return {};
  }

  const limit = Math.min(Math.max(rawLimit || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const page = Math.max(rawPage || 1, 1);

  return { take: limit, skip: (page - 1) * limit };
}

export function setTotalCountHeader(res: Response, total: number) {
  res.setHeader("X-Total-Count", String(total));
}
