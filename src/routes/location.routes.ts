import { Router } from "express";
import * as locationController from "../controllers/location.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { createLocationSchema, updateLocationSchema } from "../validators/location.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: List all active pharmacy locations
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: A list of active pharmacy locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PharmacyLocation'
 */
router.get("/", locationController.list);

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create a new pharmacy location
 *     description: Requires admin role.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchName, address]
 *             properties:
 *               branchName: { type: string, example: "Ingata Pharmacy - Kigali City Branch" }
 *               address: { type: string, example: "KN 4 Ave, Kigali, Rwanda" }
 *               telephone: { type: string, nullable: true, example: "+250788123456" }
 *               latitude: { type: number, nullable: true, example: -1.9441 }
 *               longitude: { type: number, nullable: true, example: 30.0619 }
 *               openingHours:
 *                 type: object
 *                 nullable: true
 *                 example: { monday: "8:00-20:00", tuesday: "8:00-20:00" }
 *               availableServices:
 *                 type: array
 *                 nullable: true
 *                 items: { type: string }
 *                 example: ["prescription-refills", "vaccinations"]
 *               isActive: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: The created pharmacy location
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PharmacyLocation'
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
  validateBody(createLocationSchema),
  locationController.create
);

/**
 * @swagger
 * /api/locations/{id}:
 *   patch:
 *     summary: Update an existing pharmacy location
 *     description: Requires admin role.
 *     tags: [Locations]
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
 *               branchName: { type: string }
 *               telephone: { type: string, nullable: true }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: The updated pharmacy location
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PharmacyLocation'
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
 *         description: Pharmacy location not found
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
  validateBody(updateLocationSchema),
  locationController.update
);

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Delete a pharmacy location
 *     description: Requires admin role.
 *     tags: [Locations]
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
 *         description: Pharmacy location deleted successfully
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
 *         description: Pharmacy location not found
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
  locationController.remove
);

export default router;
