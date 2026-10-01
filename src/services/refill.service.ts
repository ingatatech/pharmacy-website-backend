import { repo } from "../db/data-source";
import { RefillRequest } from "../db/entities";
import { updateOrFail } from "../db/errors";
import { PaginationOptions } from "../utils/pagination";
import {
  CreateRefillRequestInput,
  UpdateRefillRequestInput,
} from "../validators/refill.validator";

/**
 * The validated HTTP body plus the two fields the server owns.
 *
 * `status` is absent from createRefillRequestSchema (which is strict) because a
 * new request is always "submitted" regardless of what a client sends; only the
 * admin update path may change it. `userId` comes from the optional-authenticated
 * req.user and is undefined for anonymous submissions, stored as SQL NULL.
 */
export type CreateRefillRequestData = CreateRefillRequestInput & {
  status: "submitted";
  userId?: string | null;
};

export async function create(data: CreateRefillRequestData) {
  const repository = repo(RefillRequest);
  return repository.save(repository.create(data));
}

export async function findAll(pagination: PaginationOptions) {
  return Promise.all([
    repo(RefillRequest).find({
      order: { createdAt: "DESC" },
      take: pagination.take,
      skip: pagination.skip,
    }),
    repo(RefillRequest).count(),
  ]);
}

export async function findByUserId(userId: string) {
  return repo(RefillRequest).find({
    where: { userId },
    order: { createdAt: "DESC" },
  });
}

export async function update(id: string, data: UpdateRefillRequestInput) {
  return updateOrFail(repo(RefillRequest), id, data);
}