import { Router } from "express";
import * as authControllers from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// todo Защищённый маршрут

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         name:
 *           type: string
 *           nullable: true
 *         phone:
 *           type: string
 *           nullable: true
 *         avatar:
 *           type: string
 *           nullable: true
 *         role:
 *           type: string
 *           enum: [ADMIN, OWNER, USER]
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *
 *     RegisterInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *         - phone
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *
 *     UpdateProfileInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         avatar:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *
 * /auth/sign-up:
 *   post:
 *     tags: [Auth]
 *     summary: Регистрация пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *
 * /auth/sign-in:
 *   post:
 *     tags: [Auth]
 *     summary: Вход пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Выход
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
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Получить профиль
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *
 * /auth/profile-update:
 *   put:
 *     tags: [Auth]
 *     summary: Обновить профиль
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileInput'
 *     responses:
 *       200:
 *         description: Профиль обновлён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */

// ! POST
router.post("/sign-up", authControllers.signUpUser);
router.post("/sign-up", authControllers.signUpSeller);
router.post("/sign-in", authControllers.login);
router.post("/logout", authMiddleware, authControllers.logout);

export default router;
