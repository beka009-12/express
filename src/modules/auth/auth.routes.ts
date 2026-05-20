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
 *     summary: Регистрация покупателя
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
 *       400:
 *         description: Email уже зарегистрирован или не заполнены обязательные поля
 *
 * /auth/sign-up-seller:
 *   post:
 *     tags: [Auth]
 *     summary: Регистрация продавца (role=OWNER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Продавец создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Email уже зарегистрирован или не заполнены обязательные поля
 *
 * /auth/sign-in:
 *   post:
 *     tags: [Auth]
 *     summary: Вход
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
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Не заполнены обязательные поля
 *       500:
 *         description: Неверный email или пароль
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
 *       401:
 *         description: Не авторизован
 *
 * /auth/google/buyer:
 *   post:
 *     tags: [Auth]
 *     summary: Вход/регистрация покупателя через Google
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID токен полученный на фронте
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: idToken не передан
 *       401:
 *         description: Неверный Google токен
 *
 * /auth/google/seller:
 *   post:
 *     tags: [Auth]
 *     summary: Вход/регистрация продавца через Google
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID токен полученный на фронте
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: idToken не передан
 *       401:
 *         description: Неверный Google токен
 */

// ! POST
router.post("/sign-up", authControllers.signUpUser);
router.post("/sign-up-seller", authControllers.signUpSeller);
router.post("/sign-in", authControllers.login);
router.post("/logout", authMiddleware, authControllers.logout);
router.post("/google/buyer", authControllers.googleBuyer);
router.post("/google/seller", authControllers.googleSeller);

export default router;
