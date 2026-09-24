import { Router } from "express";
import * as faqController from "../controllers/faq.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { createFaqSchema, updateFaqSchema } from "../validators/faq.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

/**
 * @swagger
 * /api/faqs:
 *   get:
 *     summary: List all published FAQs, ordered by display order
 *     tags: [Faqs]
 *     responses:
 *       200:
 *         description: A list of published FAQs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Faq'
 */
router.get("/", faqController.list);

/**
 * @swagger
 * /api/faqs/admin/all:
 *   get:
 *     summary: List every FAQ, including unpublished ones
 *     description: Requires admin role.
 *     tags: [Faqs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All FAQs, ordered by display order
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Faq'
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
router.get("/admin/all", authenticate, requireRole("admin"), faqController.listAllForAdmin);

/**
 * @swagger
 * /api/faqs:
 *   post:
 *     summary: Create a new FAQ
 *     description: Requires admin role.
 *     tags: [Faqs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question: { type: string, example: "Do you accept insurance?" }
 *               answer: { type: string, example: "Yes, we work with most major insurance providers." }
 *               displayOrder: { type: integer, example: 1 }
 *               isPublished: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: The created FAQ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Faq'
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
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validateBody(createFaqSchema),
  faqController.create
);

/**
 * @swagger
 * /api/faqs/{id}:
 *   patch:
 *     summary: Update an existing FAQ
 *     description: Requires admin role.
 *     tags: [Faqs]
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
 *               question: { type: string }
 *               answer: { type: string }
 *               displayOrder: { type: integer }
 *               isPublished: { type: boolean }
 *     responses:
 *       200:
 *         description: The updated FAQ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Faq'
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
 *         description: FAQ not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validateParams(idParamSchema),
  validateBody(updateFaqSchema),
  faqController.update
);

/**
 * @swagger
 * /api/faqs/{id}:
 *   delete:
 *     summary: Delete a FAQ
 *     description: Requires admin role.
 *     tags: [Faqs]
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
 *         description: FAQ deleted successfully
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
 *         description: FAQ not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validateParams(idParamSchema),
  faqController.remove
);

export default router;
