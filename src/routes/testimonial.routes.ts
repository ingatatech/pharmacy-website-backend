import { Router } from "express";
import * as testimonialController from "../controllers/testimonial.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { createTestimonialSchema, updateTestimonialSchema } from "../validators/testimonial.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

/**
 * @swagger
 * /api/testimonials:
 *   get:
 *     summary: List all published testimonials, ordered by display order
 *     tags: [Testimonials]
 *     responses:
 *       200:
 *         description: A list of published testimonials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Testimonial'
 */
router.get("/", testimonialController.list);

/**
 * @swagger
 * /api/testimonials/admin/all:
 *   get:
 *     summary: List every testimonial, including unpublished ones
 *     description: Requires admin role.
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All testimonials, ordered by display order
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Testimonial'
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
router.get("/admin/all", authenticate, requireRole("admin"), testimonialController.listAllForAdmin);

/**
 * @swagger
 * /api/testimonials:
 *   post:
 *     summary: Create a new testimonial
 *     description: >
 *       Requires admin role. New testimonials default to unpublished —
 *       a real, pharmacy-approved quote from the customer named must be
 *       confirmed before publishing.
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, testimonialText]
 *             properties:
 *               customerName: { type: string, example: "Jane U." }
 *               customerCategory: { type: string, example: "Chronic-care customer" }
 *               testimonialText: { type: string, example: "The pharmacist walked me through every question I had about my prescription." }
 *               photoUrl: { type: string, example: "/uploads/jane.jpg" }
 *               displayOrder: { type: integer, example: 1 }
 *               isPublished: { type: boolean, example: false }
 *     responses:
 *       201:
 *         description: The created testimonial
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Testimonial'
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
  validateBody(createTestimonialSchema),
  testimonialController.create
);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   patch:
 *     summary: Update an existing testimonial
 *     description: Requires admin role.
 *     tags: [Testimonials]
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
 *               customerName: { type: string }
 *               customerCategory: { type: string }
 *               testimonialText: { type: string }
 *               photoUrl: { type: string }
 *               displayOrder: { type: integer }
 *               isPublished: { type: boolean }
 *     responses:
 *       200:
 *         description: The updated testimonial
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Testimonial'
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
 *         description: Testimonial not found
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
  validateBody(updateTestimonialSchema),
  testimonialController.update
);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   delete:
 *     summary: Delete a testimonial
 *     description: Requires admin role.
 *     tags: [Testimonials]
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
 *         description: Testimonial deleted successfully
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
 *         description: Testimonial not found
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
  testimonialController.remove
);

export default router;
