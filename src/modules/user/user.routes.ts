import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as userControllers from "./user.controller";

const router = Router();

/**
 * @openapi
 * /user/profile:
 *   get:
 *     tags: [User]
 *     summary: Получить профиль текущего пользователя
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
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Пользователь не найден
 *   put:
 *     tags: [User]
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
 *       400:
 *         description: Email уже используется
 *       401:
 *         description: Не авторизован
 */

// ! GET
router.get("/profile", authMiddleware, userControllers.getProfileController);
// ! PUT
router.put("/profile", authMiddleware, userControllers.updateProfileController);

export default router;
