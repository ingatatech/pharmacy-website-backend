import { Router } from "express";
import * as refillController from "../controllers/refill.controller";
import { publicFormLimiter } from "../middleware/rateLimiter.middleware";
import { authenticate, optionalAuthenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { createRefillRequestSchema, updateRefillRequestSchema } from "../validators/refill.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

/**
 * @swagger
 * /api/prescription-refill:
 *   post:
 *     summary: Submit a prescription refill request
 *     description: >
 *       Rate limited to 5 requests per 15 minutes per IP address. No account
 *       is required. If the request includes a valid bearer token, the
 *       request is linked to that account so it shows up in
 *       GET /api/prescription-refill/mine; if not, it's submitted
 *       anonymously exactly as before.
 *     tags: [Refill]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefillRequestInput'
 *     responses:
 *       201:
 *         description: Refill request received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Your request has been received successfully. A member of our pharmacy team will review your request and contact you using the information you provided.
 *                 disclaimer:
 *                   type: string
 *                   example: Please note that submission of a request does not constitute prescription approval, renewal or confirmation that the requested medicine is available.
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Too many requests. Please try again later.
 */
router.post(
  "/",
  publicFormLimiter,
  optionalAuthenticate,
  validateBody(createRefillRequestSchema),
  refillController.create
);

/**
 * @swagger
 * /api/prescription-refill/mine:
 *   get:
 *     summary: List the authenticated caller's own prescription refill requests
 *     description: Requires authentication (any role) — not admin-only. Returns only requests submitted while logged in as this account.
 *     tags: [Refill]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The caller's own refill requests, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RefillRequest'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/mine", authenticate, refillController.listMine);

/**
 * @swagger
 * /api/prescription-refill/admin/all:
 *   get:
 *     summary: List all submitted prescription refill requests, newest first
 *     description: Requires admin role.
 *     tags: [Refill]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: Page number (1-indexed). Omit both page and limit to get the full list.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: Results per page (default 50, max 200).
 *     responses:
 *       200:
 *         description: All refill requests. Total match count is returned in the X-Total-Count header.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RefillRequest'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller does not have the admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/admin/all", authenticate, requireRole("admin"), refillController.listAllForAdmin);

/**
 * @swagger
 * /api/prescription-refill/admin/{id}:
 *   patch:
 *     summary: Update a prescription refill request's status
 *     description: Requires admin role.
 *     tags: [Refill]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [submitted, under_review, approved, rejected, completed] }
 *     responses:
 *       200:
 *         description: The updated refill request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefillRequest'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller does not have the admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Refill request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/admin/:id",
  authenticate,
  requireRole("admin"),
  validateParams(idParamSchema),
  validateBody(updateRefillRequestSchema),
  refillController.update
);

/**
 * @swagger
 * /api/prescription-refill/admin/{id}:
 *   delete:
 *     summary: Delete a prescription refill request
 *     description: Requires admin role. Permanently removes the request.
 *     tags: [Refill]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Refill request deleted successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller does not have the admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Refill request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/admin/:id",
  authenticate,
  requireRole("admin"),
  validateParams(idParamSchema),
  refillController.remove
);

export default router;
