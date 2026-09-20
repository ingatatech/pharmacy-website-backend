import { Router } from "express";
import * as serviceController from "../controllers/service.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { createServiceSchema, updateServiceSchema } from "../validators/service.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: List all published services
 *     tags: [Services]
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
 *         description: A list of published pharmacy services. Total match count is returned in the X-Total-Count header.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 */
router.get("/", serviceController.list);

/**
 * @swagger
 * /api/services/{slug}:
 *   get:
 *     summary: Get a single published service by slug
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: prescription-refills
 *     responses:
 *       200:
 *         description: The requested service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:slug", serviceController.getBySlug);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a new service
 *     description: Requires admin role.
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, shortDescription]
 *             properties:
 *               name: { type: string, example: "Prescription Refills" }
 *               slug: { type: string, example: "prescription-refills" }
 *               shortDescription: { type: string, example: "Fast, convenient refills for your ongoing medication." }
 *               detailedDescription: { type: string, nullable: true }
 *               imageUrl: { type: string, nullable: true }
 *               keyBenefit: { type: string, nullable: true }
 *               intendedCustomers: { type: string, nullable: true }
 *               requirements: { type: string, nullable: true }
 *               process: { type: string, nullable: true }
 *               limitations: { type: string, nullable: true }
 *               isPublished: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: The created service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
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
  validateBody(createServiceSchema),
  serviceController.create
);

/**
 * @swagger
 * /api/services/{id}:
 *   patch:
 *     summary: Update an existing service
 *     description: Requires admin role.
 *     tags: [Services]
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
 *               name: { type: string, example: "Prescription Refills" }
 *               shortDescription: { type: string }
 *               isPublished: { type: boolean }
 *     responses:
 *       200:
 *         description: The updated service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
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
 *         description: Service not found
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
  validateBody(updateServiceSchema),
  serviceController.update
);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Delete a service
 *     description: Requires admin role.
 *     tags: [Services]
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
 *         description: Service deleted successfully
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
 *         description: Service not found
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
  serviceController.remove
);

export default router;
