import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { registerLimiter, loginLimiter } from "../middleware/rateLimiter.middleware";
import { loginSchema, registerSchema, updateProfileSchema } from "../validators/auth.validator";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create a new customer account
 *     description: >
 *       Public — no authentication required. Rate limited to 5 requests per
 *       15 minutes per IP address. The created account always has the
 *       "customer" role; a "role" sent in the body is simply ignored, so this
 *       endpoint can never be used to obtain elevated access. Staff accounts
 *       are provisioned separately: pharmacist_reviewer by an admin through
 *       POST /api/admin/users, and admin only by the seed:admin script. Returns
 *       a JWT immediately, the same as logging in.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName: { type: string, example: "Jane Customer" }
 *               email: { type: string, format: email, example: "jane@example.com" }
 *               password: { type: string, format: password, example: "at-least-8-characters" }
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user:
 *                   $ref: '#/components/schemas/PublicUser'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: A user with that email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.post("/register", registerLimiter, validateBody(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     description: >
 *       Returns a JWT bearer token on success. Use the "Authorize" button
 *       above to attach this token to subsequent requests. Rate limited to
 *       10 requests per 15 minutes per IP address.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "admin@ingata.com" }
 *               password: { type: string, format: password, example: "changeme123" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/PublicUser'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.post("/login", loginLimiter, validateBody(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user's profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", authenticate, authController.me);

/**
 * @swagger
 * /api/auth/me:
 *   patch:
 *     summary: Update the currently authenticated user's own profile
 *     description: >
 *       Self-service only — there is no `role` field on this endpoint, so a
 *       caller can never change their own role. Only the fields provided are
 *       changed; sending a password re-hashes and replaces it.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string, example: "Jane Customer" }
 *               email: { type: string, format: email, example: "jane@example.com" }
 *               password: { type: string, format: password, example: "at-least-8-characters" }
 *     responses:
 *       200:
 *         description: The updated profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       409:
 *         description: A user with that email already exists
 */
router.patch("/me", authenticate, validateBody(updateProfileSchema), authController.updateMe);

export default router;
