import { Request, Response } from "express";
import * as contactService from "../services/contact.service";
import { parsePagination, setTotalCountHeader } from "../utils/pagination";
import { isNotFoundError } from "../db/errors";
import { CreateContactInquiryInput, UpdateContactInquiryInput } from "../validators/contact.validator";
import { CreateContactInquiryData } from "../services/contact.service";

export async function create(req: Request<{}, unknown, CreateContactInquiryInput>, res: Response) {
  // POST /api/contact stays public — optionalAuthenticate (not authenticate)
  // runs ahead of this in the route, so req.user is only set when the
  // caller happened to send a valid token. Anonymous submissions still
  // work exactly as before, just with no userId attached.
  const data: CreateContactInquiryData = { ...req.body, userId: req.user?.userId };
  await contactService.create(data);

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

export async function listMine(req: Request, res: Response) {
  const inquiries = await contactService.findByUserId(req.user!.userId);

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

export async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    await contactService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Contact inquiry not found." });
    }
    throw error;
  }
}
