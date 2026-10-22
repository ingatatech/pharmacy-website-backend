import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";

/**
 * Cloudinary is configured lazily (on first upload) rather than at import time,
 * for the same reason `jwt.ts` reads JWT_SECRET inside `getSecret()`: this
 * module is imported by `app.ts`, which the test suite loads before any
 * environment variable is guaranteed to be set. Configuring at import would
 * either throw during a `npm test` run that never touches uploads, or silently
 * capture empty credentials.
 */
let configured = false;

function ensureConfigured(): void {
  if (configured) {
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY " +
        "and CLOUDINARY_API_SECRET in the environment (see .env.example)."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    // Always hand back an https URL — the site is served over https in
    // production, and a mixed-content http image would simply be blocked.
    secure: true,
  });

  configured = true;
}

/**
 * The folder every uploaded image lands in. Keeping uploads under one named
 * folder makes them easy to find (and bulk-manage) in the Cloudinary media
 * library, instead of being mixed in with everything else in the account.
 */
const UPLOAD_FOLDER = "ingata-pharmacy";

/**
 * Uploads an in-memory image buffer to Cloudinary and resolves with the
 * secure URL. `upload_stream` is used rather than `upload` because the file
 * arrives from multer's memory storage as a Buffer, not a filesystem path —
 * that keeps the API working on a host like Render, where the container's
 * disk is ephemeral and a locally-written file would vanish on the next
 * deploy (and is not shared across instances).
 */
export function uploadImageToCloudinary(buffer: Buffer, mimetype: string): Promise<string> {
  ensureConfigured();

  const options: UploadApiOptions = {
    folder: UPLOAD_FOLDER,
    resource_type: "image",
    // Let Cloudinary derive the format from the actual file, but keep the
    // original when it already is one of the formats the forms accept.
    unique_filename: true,
    overwrite: false,
  };

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result?: UploadApiResponse) => {
      if (error) {
        return reject(error);
      }
      if (!result?.secure_url) {
        return reject(new Error("Cloudinary did not return a URL for the uploaded image."));
      }
      resolve(result.secure_url);
    });

    stream.end(buffer);
  });
}

/** True when all three Cloudinary environment variables are present. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}
