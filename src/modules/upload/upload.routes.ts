import { Router } from "express";
import uploadControllers from "./upload.controller";
import { upload } from "../../plugin/multer";

const router = Router();

/**
 * @openapi
 * /upload/file:
 *   post:
 *     tags: [Upload]
 *     summary: Загрузить один файл
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Файл загружен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *
 * /upload/files:
 *   post:
 *     tags: [Upload]
 *     summary: Загрузить несколько файлов (до 10)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Файлы загружены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 */

router.post("/file", upload.single("file"), uploadControllers.uploadFile);
router.post(
  "/files",
  upload.array("files", 10),
  uploadControllers.uploadMultipleFiles
);

export default router;
