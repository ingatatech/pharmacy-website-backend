import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AppDataSource } from "../data-source";
import { RefillRequest } from "../entities/RefillRequest";
import { publicFormLimiter } from "../middleware/rateLimiter";
import { authenticate, requireRole } from "../middleware/auth";
import { parsePagination, setTotalCountHeader } from "../utils/pagination";

const router = Router();

const refillValidationRules = [
  body("fullName").trim().notEmpty().withMessage("Full name is required."),
  body("phoneNumber").trim().notEmpty().withMessage("Phone number is required."),
];

/**
 * @swagger
 * /api/prescription-refill:
 *   post:
 *     summary: Submit a prescription refill request
 *     description: Rate limited to 5 requests per 15 minutes per IP address.
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
router.post("/", publicFormLimiter, refillValidationRules, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Please check the highlighted fields and try again.",
      details: errors.array(),
    });
  }

  const {
    fullName,
    phoneNumber,
    email,
    preferredBranch,
    prescriptionReference,
    medicationName,
    additionalNotes,
    preferredPickupMethod,
  } = req.body;

  const refillRequestRepository = AppDataSource.getRepository(RefillRequest);
  const refillRequest = refillRequestRepository.create({
    fullName,
    phoneNumber,
    email,
    preferredBranch,
    prescriptionReference,
    medicationName,
    additionalNotes,
    preferredPickupMethod,
    status: "submitted",
  });
  await refillRequestRepository.save(refillRequest);

  res.status(201).json({
    message:
      "Your request has been received successfully. A member of our pharmacy team will review your request and contact you using the information you provided.",
    disclaimer:
      "Please note that submission of a request does not constitute prescription approval, renewal or confirmation that the requested medicine is available.",
  });
});

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
router.get("/admin/all", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const refillRequestRepository = AppDataSource.getRepository(RefillRequest);
  const [refillRequests, total] = await refillRequestRepository.findAndCount({
    order: { createdAt: "DESC" },
    ...parsePagination(req),
  });

  setTotalCountHeader(res, total);
  res.json(refillRequests);
});

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
router.patch("/admin/:id", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const refillRequestRepository = AppDataSource.getRepository(RefillRequest);
  const refillRequest = await refillRequestRepository.findOne({ where: { id: String(req.params.id) } });

  if (!refillRequest) {
    return res.status(404).json({ error: "Refill request not found." });
  }

  refillRequestRepository.merge(refillRequest, req.body);
  await refillRequestRepository.save(refillRequest);

  res.json(refillRequest);
});

export default router;
