import { Router } from "express";
import * as uploadController from "../controllers/upload.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload an image and get back its URL
 *     description: >
 *       Requires admin role. Accepts multipart/form-data with a single "image"
 *       field (JPEG, PNG, WebP, or GIF, max 5MB). The returned url can be used
 *       directly as a Product/Service imageUrl or Article featuredImageUrl.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: The uploaded file's URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: /uploads/3fa85f64-5717-4562-b3fc-2c963f66afa6.jpg
 *       400:
 *         description: No file provided, or an unsupported file type/size
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
  uploadController.handleUpload,
  uploadController.create
);

export default router;
