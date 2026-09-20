import { Request, Response } from "express";
import * as contactService from "../services/contact.service";
import { parsePagination, setTotalCountHeader } from "../utils/pagination";
import { isNotFoundError } from "../utils/prisma-errors";
import { CreateContactInquiryInput, UpdateContactInquiryInput } from "../validators/contact.validator";

export async function create(req: Request<{}, unknown, CreateContactInquiryInput>, res: Response) {
  await contactService.create(req.body);

  res.status(201).json({
    message:
      "Your request has been received successfully. A member of our pharmacy team will review your request and contact you using the information you provided.",
  });
}

export async function listAllForAdmin(req: Request, res: Response) {
  const [inquiries, total] = await contactService.findAll(parsePagination(req));

  setTotalCountHeader(res, total);
  res.json(inquiries);
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateContactInquiryInput>,
  res: Response
) {
  try {
    const inquiry = await contactService.update(req.params.id, req.body);
    res.json(inquiry);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Contact inquiry not found." });
    }
    throw error;
  }
}
