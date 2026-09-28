import { Router } from "express";
import * as pharmacistController from "../controllers/pharmacist.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { updateOwnBranchSchema } from "../validators/location.validator";
import { updateRefillRequestSchema } from "../validators/refill.validator";
import { updateContactInquirySchema } from "../validators/contact.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

// Every route here requires a valid JWT and the pharmacist_reviewer role
// specifically. An admin is NOT accepted: this is the pharmacist's own area,
// and an admin manages branches through /api/locations instead. Requiring the
// exact role also means a customer can never reach it.
router.use(authenticate, requireRole("pharmacist_reviewer"));

/**
 * @swagger
 * /api/pharmacist/branch:
 *   get:
 *     summary: Get the branch assigned to the signed-in pharmacist
 *     description: >
 *       Returns { branch: null } when no branch is assigned yet. The branch is
 *       always resolved from the authenticated user, never from a parameter.
 *     tags: [Pharmacist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The pharmacist's branch, or null if unassigned
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller is not a pharmacist_reviewer
 */
router.get("/branch", pharmacistController.getBranch);

/**
 * @swagger
 * /api/pharmacist/branch:
 *   patch:
 *     summary: Update the signed-in pharmacist's own branch details
 *     description: >
 *       Operational fields only. slug, isActive and availableServices are
 *       rejected (400) — those are admin-level changes.
 *     tags: [Pharmacist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branchName: { type: string }
 *               address: { type: string }
 *               telephone: { type: string, nullable: true }
 *               latitude: { type: number, nullable: true }
 *               longitude: { type: number, nullable: true }
 *               openingHours: { type: object, nullable: true }
 *               description: { type: string, nullable: true }
 *               photoUrl: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: The updated branch
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller is not a pharmacist_reviewer
 *       409:
 *         description: No branch is assigned to this account yet
 */
router.patch("/branch", validateBody(updateOwnBranchSchema), pharmacistController.updateBranch);

/**
 * @swagger
 * /api/pharmacist/branch/team:
 *   get:
 *     summary: List team members at the pharmacist's branch
 *     tags: [Pharmacist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The branch's team members
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller is not a pharmacist_reviewer
 */
router.get("/branch/team", pharmacistController.getBranchTeam);

/**
 * @swagger
 * /api/pharmacist/refills:
 *   get:
 *     summary: List refill requests for the pharmacist's branch
 *     description: Scoped to the caller's own branch. Returns [] if unassigned.
 *     tags: [Pharmacist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The branch's refill requests
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller is not a pharmacist_reviewer
 */
router.get("/refills", pharmacistController.listRefills);

/**
 * @swagger
 * /api/pharmacist/refills/{id}:
 *   patch:
 *     summary: Update a refill request belonging to the pharmacist's branch
 *     description: >
 *       404 if the id belongs to another branch — the branch is part of the
 *       lookup, so ids cannot be used to reach another branch's requests.
 *     tags: [Pharmacist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [submitted, under_review, approved, rejected, completed]
 *     responses:
 *       200:
 *         description: The updated refill request
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller is not a pharmacist_reviewer
 *       404:
 *         description: Not found, or belongs to another branch
 */
router.patch(
  "/refills/:id",
  validateParams(idParamSchema),
  validateBody(updateRefillRequestSchema),
  pharmacistController.updateRefill
);

/**
 * @swagger
 * /api/pharmacist/inquiries:
 *   get:
 *     summary: List contact inquiries for the pharmacist's branch
 *     tags: [Pharmacist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The branch's inquiries
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller is not a pharmacist_reviewer
 */
router.get("/inquiries", pharmacistController.listInquiries);

/**
 * @swagger
 * /api/pharmacist/inquiries/{id}:
 *   patch:
 *     summary: Update a contact inquiry belonging to the pharmacist's branch
 *     description: 404 if the id belongs to another branch.
 *     tags: [Pharmacist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [new, in_progress, resolved] }
 *     responses:
 *       200:
 *         description: The updated inquiry
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller is not a pharmacist_reviewer
 *       404:
 *         description: Not found, or belongs to another branch
 */
router.patch(
  "/inquiries/:id",
  validateParams(idParamSchema),
  validateBody(updateContactInquirySchema),
  pharmacistController.updateInquiry
);

export default router;
