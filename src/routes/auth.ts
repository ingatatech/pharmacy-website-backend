import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { signToken } from "../utils/jwt";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     description: Returns a JWT bearer token on success. Use the "Authorize" button above to attach this token to subsequent requests.
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
 */
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { email: String(email) },
    select: { id: true, email: true, passwordHash: true, fullName: true, role: true },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(String(password), user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user.id, user.role);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

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
router.get("/me", authenticate, async (req: Request, res: Response) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: req.user!.userId } });

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
});

export default router;
