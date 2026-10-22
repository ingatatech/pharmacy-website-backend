import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";
import { uploadImageToCloudinary } from "../config/cloudinary";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function fileFilter(_req: Request, file: Express.Multer.File, callback: FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return callback(new Error("Only JPEG, PNG, WebP, and GIF images are allowed."));
  }
  callback(null, true);
}

// Memory storage: the file is held in a Buffer and streamed straight to
// Cloudinary, never written to the server's disk. That is what makes the
// upload work on an ephemeral host like Render, where a local ./uploads
// directory is neither persistent across deploys nor shared between
// instances.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, (error: unknown) => {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    next();
  });
}

export async function create(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No image file was provided." });
  }

  const url = await uploadImageToCloudinary(req.file.buffer, req.file.mimetype);
  res.status(201).json({ url });
}
