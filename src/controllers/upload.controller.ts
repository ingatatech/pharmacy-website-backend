import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer, { FileFilterCallback } from "multer";

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

export function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, (error: unknown) => {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    next();
  });
}

export function create(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No image file was provided." });
  }

  res.status(201).json({ url: `/uploads/${req.file.filename}` });
}
