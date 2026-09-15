import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AppDataSource } from "../data-source";
import { RefillRequest } from "../entities/RefillRequest";
import { publicFormLimiter } from "../middleware/rateLimiter";

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

export default router;
