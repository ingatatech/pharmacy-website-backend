import { Request, Response } from "express";
import * as pharmacistService from "../services/pharmacist.service";
import * as locationService from "../services/location.service";
import { isNotFoundError } from "../db/errors";
import { parsePagination, setTotalCountHeader } from "../utils/pagination";
import { UpdateOwnBranchInput } from "../validators/location.validator";
import { UpdateRefillRequestInput } from "../validators/refill.validator";
import { UpdateContactInquiryInput } from "../validators/contact.validator";

/**
 * Every handler here resolves the branch through
 * pharmacistService.findBranchForUser(req.user.userId) and then acts on *that*
 * id. There is deliberately no handler that accepts a branch id from the
 * client, so a pharmacist cannot read or edit another branch by changing a
 * parameter.
 */
export async function getBranch(req: Request, res: Response) {
  const branch = await pharmacistService.findBranchForUser(req.user!.userId);

  // Not an error: a pharmacist can legitimately be created before a branch is
  // chosen, and an empty-but-explicit state lets the UI prompt them to ask an
  // admin to assign one instead of showing a confusing failure.
  res.json({ branch });
}

export async function updateBranch(req: Request<{}, unknown, UpdateOwnBranchInput>, res: Response) {
  const branch = await pharmacistService.findBranchForUser(req.user!.userId);

  if (!branch) {
    return res.status(409).json({ error: "No branch is assigned to your account yet." });
  }

  try {
    const updated = await locationService.update(branch.id, req.body);
    res.json(updated);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Branch not found." });
    }
    throw error;
  }
}

export async function getBranchTeam(req: Request, res: Response) {
  const branch = await pharmacistService.findBranchForUser(req.user!.userId);

  if (!branch) {
    return res.json({ team: [] });
  }

  const team = await pharmacistService.findTeamForBranch(branch.id);
  res.json({ team });
}

export async function listRefills(req: Request, res: Response) {
  const branch = await pharmacistService.findBranchForUser(req.user!.userId);

  if (!branch) {
    return res.json([]);
  }

  const [refills, total] = await pharmacistService.findRefillsForBranch(
    branch.id,
    parsePagination(req)
  );

  setTotalCountHeader(res, total);
  res.json(refills);
}

export async function updateRefill(
  req: Request<{ id: string }, unknown, UpdateRefillRequestInput>,
  res: Response
) {
  const branch = await pharmacistService.findBranchForUser(req.user!.userId);

  if (!branch) {
    return res.status(404).json({ error: "Refill request not found." });
  }

  // The branch is part of the lookup, so a request id from another branch
  // matches nothing and returns 404. Deliberately not 403: telling a
  // pharmacist that an id exists but is forbidden would leak that another
  // branch has such a request.
  const refill = await pharmacistService.updateRefillForBranch(
    req.params.id,
    branch.id,
    req.body
  );

  if (!refill) {
    return res.status(404).json({ error: "Refill request not found." });
  }

  res.json(refill);
}

export async function listInquiries(req: Request, res: Response) {
  const branch = await pharmacistService.findBranchForUser(req.user!.userId);

  if (!branch) {
    return res.json([]);
  }

  const [inquiries, total] = await pharmacistService.findInquiriesForBranch(
    branch.id,
    parsePagination(req)
  );

  setTotalCountHeader(res, total);
  res.json(inquiries);
}

export async function updateInquiry(
  req: Request<{ id: string }, unknown, UpdateContactInquiryInput>,
  res: Response
) {
  const branch = await pharmacistService.findBranchForUser(req.user!.userId);

  if (!branch) {
    return res.status(404).json({ error: "Inquiry not found." });
  }

  const inquiry = await pharmacistService.updateInquiryForBranch(
    req.params.id,
    branch.id,
    req.body
  );

  if (!inquiry) {
    return res.status(404).json({ error: "Inquiry not found." });
  }

  res.json(inquiry);
}
