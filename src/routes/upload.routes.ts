import { Router } from "express";
import * as uploadController from "../controllers/upload.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload an image and get back its public URL
 *     description: >
 *       Requires admin role. Send multipart/form-data with a single "image"
 *       field (JPEG, PNG, WebP or GIF, max 5MB) — in the Swagger UI below,
 *       click "Try it out", then "Choose File" to pick an image from your
 *       computer and "Execute". The file is streamed to Cloudinary (nothing is
 *       written to the server's disk) and the response contains its public
 *       https URL, e.g.
 *       https://res.cloudinary.com/<cloud>/image/upload/ingata-pharmacy/<id>.jpg
 *
 *       Use that returned url directly as a Product/Service imageUrl, an
 *       Article featuredImageUrl, or a Location/TeamMember photoUrl.
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
 *                 description: The image file to upload (JPEG, PNG, WebP or GIF, max 5MB).
 *     responses:
 *       201:
 *         description: The uploaded image's public URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: https://res.cloudinary.com/ingata/image/upload/v1730000000/ingata-pharmacy/3fa85f64-5717-4562-b3fc-2c963f66afa6.jpg
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
 *       500:
 *         description: Cloudinary is not configured, or rejected the upload
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
