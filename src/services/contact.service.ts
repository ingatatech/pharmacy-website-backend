import { repo } from "../db/data-source";
import { ContactInquiry } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
import { PaginationOptions } from "../utils/pagination";
import {
  CreateContactInquiryInput,
  UpdateContactInquiryInput,
} from "../validators/contact.validator";

/**
 * The validated HTTP body plus the one field the server owns.
 *
 * `userId` is deliberately absent from createContactInquirySchema (which is
 * strict, so a client cannot spoof it) and is attached by the controller from
 * the optional-authenticated req.user. POST /api/contact is public, so it is
 * undefined for anonymous submissions and stored as SQL NULL.
 */
export type CreateContactInquiryData = CreateContactInquiryInput & {
  userId?: string | null;
};

export async function create(data: CreateContactInquiryData) {
  const repository = repo(ContactInquiry);
  return repository.save(repository.create(data));
}

export async function findAll(pagination: PaginationOptions) {
  return Promise.all([
    repo(ContactInquiry).find({
      order: { createdAt: "DESC" },
      take: pagination.take,
      skip: pagination.skip,
    }),
    repo(ContactInquiry).count(),
  ]);
}

export async function findByUserId(userId: string) {
  return repo(ContactInquiry).find({
    where: { userId },
    order: { createdAt: "DESC" },
  });
}

export async function update(id: string, data: UpdateContactInquiryInput) {
  return updateOrFail(repo(ContactInquiry), id, data);
}

export async function remove(id: string) {
  await deleteOrFail(repo(ContactInquiry), id);
}
