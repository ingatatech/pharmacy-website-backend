import { Request, Response } from "express";
import * as refillService from "../services/refill.service";
import { parsePagination, setTotalCountHeader } from "../utils/pagination";
import { isNotFoundError } from "../utils/prisma-errors";
import { CreateRefillRequestInput, UpdateRefillRequestInput } from "../validators/refill.validator";

export async function create(req: Request<{}, unknown, CreateRefillRequestInput>, res: Response) {
  await refillService.create({ ...req.body, status: "submitted", userId: req.user?.userId });

  res.status(201).json({
    message:
      "Your request has been received successfully. A member of our pharmacy team will review your request and contact you using the information you provided.",
    disclaimer:
      "Please note that submission of a request does not constitute prescription approval, renewal or confirmation that the requested medicine is available.",
  });
}

export async function listAllForAdmin(req: Request, res: Response) {
  const [refillRequests, total] = await refillService.findAll(parsePagination(req));

  setTotalCountHeader(res, total);
  res.json(refillRequests);
}

export async function listMine(req: Request, res: Response) {
  const refillRequests = await refillService.findByUserId(req.user!.userId);

  res.json(refillRequests);
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateRefillRequestInput>,
  res: Response
) {
  try {
    const refillRequest = await refillService.update(req.params.id, req.body);
    res.json(refillRequest);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Refill request not found." });
    }
    throw error;
  }
}
