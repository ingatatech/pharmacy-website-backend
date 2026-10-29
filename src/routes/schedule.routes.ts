import { Router } from "express";
import * as shiftController from "../controllers/pharmacist-shift.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import {
  createPharmacistShiftSchema,
  updatePharmacistShiftSchema,
} from "../validators/pharmacist-shift.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

/**
 * @swagger
 * /api/schedule:
 *   get:
 *     summary: Public weekly pharmacist schedule
 *     description: >
 *       Active shifts for published team members at active branches, grouped
 *       by weekday on the client. Optionally filtered by branch.
 *     tags: [Schedule]
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: A list of active shifts
 */
router.get("/", shiftController.list);

/**
 * @swagger
 * /api/schedule/admin/all:
 *   get:
 *     summary: List every shift, including inactive ones
 *     description: Requires admin role.
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All shifts
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller does not have the admin role
 */
router.get("/admin/all", authenticate, requireRole("admin"), shiftController.listAllForAdmin);

/**
 * @swagger
 * /api/schedule:
 *   post:
 *     summary: Create a weekly shift
 *     description: Requires admin role. Times are "HH:MM" (24-hour).
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: The created shift
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller does not have the admin role
 */
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validateBody(createPharmacistShiftSchema),
  shiftController.create,
);

/**
 * @swagger
 * /api/schedule/{id}:
 *   patch:
 *     summary: Update a shift
 *     description: Requires admin role.
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: The updated shift
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller does not have the admin role
 *       404:
 *         description: Shift not found
 */
router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validateParams(idParamSchema),
  validateBody(updatePharmacistShiftSchema),
  shiftController.update,
);

/**
 * @swagger
 * /api/schedule/{id}:
 *   delete:
 *     summary: Delete a shift
 *     description: Requires admin role.
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Shift deleted
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller does not have the admin role
 *       404:
 *         description: Shift not found
 */
router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validateParams(idParamSchema),
  shiftController.remove,
);

export default router;
