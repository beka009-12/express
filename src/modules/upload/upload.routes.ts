import { Router } from "express";
import uploadControllers from "./upload.controller";
import { upload } from "../../plugin/multer";

const router = Router();

router.post("/file", upload.single("file"), uploadControllers.uploadFile);
router.post(
  "/files",
  upload.array("files", 10),
  uploadControllers.uploadMultipleFiles
);
// ! store-upload

export default router;
