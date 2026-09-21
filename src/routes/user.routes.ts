import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { createUserSchema, updateUserSchema } from "../validators/user.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

// Every route below requires: 1) a valid JWT (authenticate -> 401 if missing/
// invalid), 2) the admin role specifically (requireRole("admin") -> 403 if
// authenticated as anything else). This is the exact same pair of middleware
// every other admin-only route in the app already uses.
router.use(authenticate, requireRole("admin"));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all admin/reviewer accounts
 *     description: Requires admin role.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All user accounts (passwordHash is never included)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PublicUser'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller does not have the admin role
 */
router.get("/", userController.list);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new admin or pharmacist_reviewer account
 *     description: Requires admin role. The password is hashed with bcrypt before it is stored.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password, role]
 *             properties:
 *               fullName: { type: string, example: "Jane Reviewer" }
 *               email: { type: string, format: email, example: "jane@ingata.com" }
 *               password: { type: string, format: password, example: "at-least-8-characters" }
 *               role: { type: string, enum: [admin, pharmacist_reviewer] }
 *     responses:
 *       201:
 *         description: The created user
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller does not have the admin role
 *       409:
 *         description: A user with that email already exists
 */
router.post("/", validateBody(createUserSchema), userController.create);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Update an admin/reviewer account
 *     description: >
 *       Requires admin role. Only the fields provided are changed; sending a
 *       password re-hashes and replaces it. An admin cannot change their own
 *       role away from "admin" (400) — this prevents an admin from locking
 *       themselves out.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: The updated user
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller does not have the admin role
 *       404:
 *         description: User not found
 */
router.patch("/:id", validateParams(idParamSchema), validateBody(updateUserSchema), userController.update);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete an admin/reviewer account
 *     description: >
 *       Requires admin role. Fails with 400 if you try to delete your own
 *       account (there would be no one left to manage users), and with 409
 *       if the user still owns records that reference them (authored/reviewed
 *       articles, audit log entries) — the database's foreign key protects
 *       that history from being silently orphaned.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Caller does not have the admin role
 *       404:
 *         description: User not found
 *       409:
 *         description: User still has referencing records
 */
router.delete("/:id", validateParams(idParamSchema), userController.remove);

export default router;
