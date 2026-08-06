import multer from "multer";
import { env } from "../config/env";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];

const ALL_ALLOWED = new Set([...IMAGE_TYPES, ...VIDEO_TYPES, ...DOCUMENT_TYPES]);

// Memory storage: files are buffered so sensitive ones can be encrypted
// before ever touching disk (see modules/applications for the write path).
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALL_ALLOWED.has(file.mimetype)) {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

export const registrationUploadFields = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "governmentId", maxCount: 1 },
  { name: "parentalConsent", maxCount: 1 },
]);
