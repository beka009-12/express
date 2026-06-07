import { Request } from "express";
import multer, { FileFilterCallback } from "multer";

export const ALLOWED_IMAGE_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_IMAGE_MIME[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Недопустимый тип файла "${file.mimetype}". Разрешены: JPEG, PNG, WebP, AVIF`
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 15,
  },
});
