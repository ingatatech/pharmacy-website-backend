import { Router } from "express";
import * as teamController from "../controllers/team.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { createTeamMemberSchema, updateTeamMemberSchema } from "../validators/team.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

/**
 * @swagger
 * /api/team:
 *   get:
 *     summary: List all published team members, ordered by display order
 *     tags: [Team]
 *     responses:
 *       200:
 *         description: A list of published team members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TeamMember'
 */
router.get("/", teamController.list);

/**
 * @swagger
 * /api/team/admin/all:
 *   get:
 *     summary: List every team member, including unpublished ones
 *     description: Requires admin role.
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All team members, ordered by display order
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TeamMember'
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
router.get("/admin/all", authenticate, requireRole("admin"), teamController.listAllForAdmin);

/**
 * @swagger
 * /api/team:
 *   post:
 *     summary: Create a new team member
 *     description: >
 *       Requires admin role. New members default to unpublished — real
 *       staff details should be confirmed before publishing.
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, role]
 *             properties:
 *               fullName: { type: string, example: "Dr. Alice Uwase" }
 *               role: { type: string, example: "Licensed Pharmacist" }
 *               credentials: { type: string, example: "B.Pharm, PharmD" }
 *               bio: { type: string }
 *               photoUrl: { type: string, example: "/uploads/alice.jpg" }
 *               displayOrder: { type: integer, example: 1 }
 *               isPublished: { type: boolean, example: false }
 *               locationId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       201:
 *         description: The created team member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamMember'
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
router.post("/", authenticate, requireRole("admin"), validateBody(createTeamMemberSchema), teamController.create);

/**
 * @swagger
 * /api/team/{id}:
 *   patch:
 *     summary: Update an existing team member
 *     description: Requires admin role.
 *     tags: [Team]
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
 *               fullName: { type: string }
 *               role: { type: string }
 *               credentials: { type: string }
 *               bio: { type: string }
 *               photoUrl: { type: string }
 *               displayOrder: { type: integer }
 *               isPublished: { type: boolean }
 *               locationId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       200:
 *         description: The updated team member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamMember'
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
 *         description: Team member not found
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
  validateBody(updateTeamMemberSchema),
  teamController.update
);

/**
 * @swagger
 * /api/team/{id}:
 *   delete:
 *     summary: Delete a team member
 *     description: Requires admin role.
 *     tags: [Team]
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
 *         description: Team member deleted successfully
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
 *         description: Team member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", authenticate, requireRole("admin"), validateParams(idParamSchema), teamController.remove);

export default router;
