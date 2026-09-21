import { Router } from "express";
import * as contactController from "../controllers/contact.controller";
import { publicFormLimiter } from "../middleware/rateLimiter.middleware";
import { authenticate, optionalAuthenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { createContactInquirySchema, updateContactInquirySchema } from "../validators/contact.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a customer contact inquiry
 *     description: >
 *       Rate limited to 5 requests per 15 minutes per IP address. No account
 *       is required. If the request includes a valid bearer token, the
 *       inquiry is linked to that account so it shows up in
 *       GET /api/contact/mine; if not, it's submitted anonymously exactly as
 *       before.
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactInquiryInput'
 *     responses:
 *       201:
 *         description: Inquiry received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Your request has been received successfully. A member of our pharmacy team will review your request and contact you using the information you provided.
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
  validateBody(createContactInquirySchema),
  contactController.create
);

/**
 * @swagger
 * /api/contact/mine:
 *   get:
 *     summary: List the authenticated caller's own contact inquiries
 *     description: Requires authentication (any role) — not admin-only. Returns only inquiries submitted while logged in as this account.
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The caller's own contact inquiries, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ContactInquiry'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/mine", authenticate, contactController.listMine);

/**
 * @swagger
 * /api/contact/admin/all:
 *   get:
 *     summary: List all submitted contact inquiries, newest first
 *     description: Requires admin role.
 *     tags: [Contact]
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
 *         description: All contact inquiries. Total match count is returned in the X-Total-Count header.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ContactInquiry'
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
router.get("/admin/all", authenticate, requireRole("admin"), contactController.listAllForAdmin);

/**
 * @swagger
 * /api/contact/admin/{id}:
 *   patch:
 *     summary: Update a contact inquiry's status
 *     description: Requires admin role.
 *     tags: [Contact]
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
 *               status: { type: string, enum: [new, in_progress, resolved] }
 *     responses:
 *       200:
 *         description: The updated contact inquiry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactInquiry'
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
 *         description: Contact inquiry not found
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
  validateBody(updateContactInquirySchema),
  contactController.update
);

export default router;
