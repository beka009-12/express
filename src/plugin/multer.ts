import { Request } from "express";
import multer, { FileFilterCallback, StorageEngine } from "multer";

const storage: StorageEngine = multer.memoryStorage();

const filteFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  cb(null, true);
};

export const upload = multer({ storage, fileFilter: filteFilter });
