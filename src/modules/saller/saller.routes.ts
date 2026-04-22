import { Router } from "express";
import * as sallerRouter from "./saller.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";
import { upload } from "../../plugin/multer";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Store:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         logo:
 *           type: string
 *           nullable: true
 *         address:
 *           type: string
 *           nullable: true
 *         region:
 *           type: string
 *           nullable: true
 *         isVerified:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         rating:
 *           type: number
 *           nullable: true
 *         ownerId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateStoreInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         logo:
 *           type: string
 *         address:
 *           type: string
 *         region:
 *           type: string
 *
 * /saller/sign-up-saller:
 *   post:
 *     tags: [Saller]
 *     summary: Регистрация продавца
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Продавец зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *
 * /saller/sign-in-saller:
 *   post:
 *     tags: [Saller]
 *     summary: Вход продавца
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Вход успешен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *
 * /saller/logout-seller:
 *   post:
 *     tags: [Saller]
 *     summary: Выход продавца
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Выход успешен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *
 * /saller/saller-profile:
 *   get:
 *     tags: [Saller]
 *     summary: Профиль продавца
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль продавца со списком магазинов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         stores:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Store'
 *
 * /saller/create-store:
 *   post:
 *     tags: [Saller]
 *     summary: Создать магазин
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStoreInput'
 *     responses:
 *       201:
 *         description: Магазин создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *
 * /saller/upload-store-logo:
 *   post:
 *     tags: [Saller]
 *     summary: Загрузить логотип магазина
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Логотип загружен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 url:
 *                   type: string
 *
 * /saller/my-store:
 *   get:
 *     tags: [Saller]
 *     summary: Получить мой магазин
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Магазин найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *
 * /saller/all-stores:
 *   get:
 *     tags: [Saller]
 *     summary: Получить все магазины
 *     responses:
 *       200:
 *         description: Список всех магазинов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stores:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Store'
 *                       - type: object
 *                         properties:
 *                           _count:
 *                             type: object
 *                             properties:
 *                               products:
 *                                 type: integer
 *
 * /saller/detail-store/{id}:
 *   get:
 *     tags: [Saller]
 *     summary: Детали магазина
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Магазин с товарами
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 store:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Store'
 *                     - type: object
 *                       properties:
 *                         products:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Product'
 *                         _count:
 *                           type: object
 *                           properties:
 *                             products:
 *                               type: integer
 */

// todo Защищённый маршрут

// ! POST
router.post("/sign-up-saller", sallerRouter.signUpSeller);
router.post("/sign-in-saller", sallerRouter.signInSeller);
router.post("/logout-seller", authMiddleware, sallerRouter.logautSeller);
// ! GET
router.get("/saller-profile", authMiddleware, sallerRouter.getProfileSaller);
// ! STORE
router.post("/create-store", authMiddleware, sallerRouter.createStore);
router.post(
  "/upload-store-logo",
  authMiddleware,
  upload.single("file"),
  sallerRouter.uploadStoreLogo,
);
router.get("/my-store", authMiddleware, sallerRouter.getMyStore);
router.get("/all-stores", sallerRouter.getAllStores);
router.get("/detail-store/:id", sallerRouter.getDetailStore);

export default router;
