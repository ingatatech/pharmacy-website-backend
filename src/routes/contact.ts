import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AppDataSource } from "../data-source";
import { ContactInquiry } from "../entities/ContactInquiry";
import { publicFormLimiter } from "../middleware/rateLimiter";

const router = Router();

const contactValidationRules = [
  body("fullName").trim().notEmpty().withMessage("Full name is required."),
  body("phoneNumber").trim().notEmpty().withMessage("Phone number is required."),
  body("email").trim().isEmail().withMessage("A valid email address is required."),
  body("message").trim().isLength({ min: 5 }).withMessage("Message must be at least 5 characters long."),
];

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a customer contact inquiry
 *     description: Rate limited to 5 requests per 15 minutes per IP address.
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
router.post("/", publicFormLimiter, contactValidationRules, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Please check the highlighted fields and try again.",
      details: errors.array(),
    });
  }

  const { fullName, phoneNumber, email, subject, message, preferredContactMethod, preferredBranch } = req.body;

  const contactInquiryRepository = AppDataSource.getRepository(ContactInquiry);
  const inquiry = contactInquiryRepository.create({
    fullName,
    phoneNumber,
    email,
    subject,
    message,
    preferredContactMethod,
    preferredBranch,
  });
  await contactInquiryRepository.save(inquiry);

  res.status(201).json({
    message:
      "Your request has been received successfully. A member of our pharmacy team will review your request and contact you using the information you provided.",
  });
});

export default router;
