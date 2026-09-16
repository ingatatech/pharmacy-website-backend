import { Router, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer, { FileFilterCallback } from "multer";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, UPLOADS_DIR),
  filename: (_req, file, callback) => {
    callback(null, `${randomUUID()}${ALLOWED_MIME_TYPES[file.mimetype]}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, callback: FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    return callback(new Error("Only JPEG, PNG, WebP, and GIF images are allowed."));
  }
  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

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
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("image")(req, res, (error: unknown) => {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file was provided." });
    }

    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  }
);

export default router;
