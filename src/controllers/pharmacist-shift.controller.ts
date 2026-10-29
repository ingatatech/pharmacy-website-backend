import { Request, Response } from "express";
import * as shiftService from "../services/pharmacist-shift.service";
import * as pharmacistService from "../services/pharmacist.service";
import { isNotFoundError } from "../db/errors";
import {
  CreatePharmacistShiftInput,
  UpdatePharmacistShiftInput,
} from "../validators/pharmacist-shift.validator";

export async function list(req: Request, res: Response) {
  const locationId = typeof req.query.locationId === "string" ? req.query.locationId : undefined;
  res.json(await shiftService.findPublic(locationId));
}

export async function listAllForAdmin(_req: Request, res: Response) {
  res.json(await shiftService.findAll());
}

export async function create(req: Request<{}, unknown, CreatePharmacistShiftInput>, res: Response) {
  res.status(201).json(await shiftService.create(req.body));
}

export async function update(
  req: Request<{ id: string }, unknown, UpdatePharmacistShiftInput>,
  res: Response,
) {
  try {
    res.json(await shiftService.update(req.params.id, req.body));
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Shift not found." });
    }
    throw error;
  }
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    await shiftService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Shift not found." });
    }
    throw error;
  }
}

/**
 * The signed-in pharmacist's own branch roster. The branch is resolved from
 * the authenticated account (never from a parameter), so this cannot be used
 * to read another branch's schedule — same rule as every other
 * /api/pharmacist route.
 */
export async function listForOwnBranch(req: Request, res: Response) {
  const branch = await pharmacistService.findBranchForUser(req.user!.userId);

  if (!branch) {
    return res.json({ branch: null, shifts: [] });
  }

  const shifts = await shiftService.findForBranch(branch.id);

  res.json({
    branch: { id: branch.id, branchName: branch.branchName, slug: branch.slug },
    shifts,
  });
}
