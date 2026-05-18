import { Router } from "express";
import * as address from "./address.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         label:
 *           type: string
 *           example: Дом
 *         name:
 *           type: string
 *           example: Иван Иванов
 *         phone:
 *           type: string
 *           example: "+996700123456"
 *         address:
 *           type: string
 *           example: ул. Манаса 45, кв. 12
 *         city:
 *           type: string
 *           example: Бишкек
 *         region:
 *           type: string
 *           nullable: true
 *         isDefault:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateAddressInput:
 *       type: object
 *       required: [label, name, phone, address]
 *       properties:
 *         label:
 *           type: string
 *           example: Дом
 *         name:
 *           type: string
 *           example: Иван Иванов
 *         phone:
 *           type: string
 *           example: "+996700123456"
 *         address:
 *           type: string
 *           example: ул. Манаса 45, кв. 12
 *         city:
 *           type: string
 *           default: Бишкек
 *         region:
 *           type: string
 *           nullable: true
 *         isDefault:
 *           type: boolean
 *           default: false
 *
 * /addresses:
 *   get:
 *     tags: [Address]
 *     summary: Список адресов пользователя (дефолтный первым)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Адреса пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addresses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *   post:
 *     tags: [Address]
 *     summary: Добавить адрес (первый автоматически становится дефолтным)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAddressInput'
 *     responses:
 *       201:
 *         description: Адрес добавлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 address:
 *                   $ref: '#/components/schemas/Address'
 *       400:
 *         description: Ошибка валидации
 *
 * /addresses/{id}:
 *   patch:
 *     tags: [Address]
 *     summary: Обновить адрес
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAddressInput'
 *     responses:
 *       200:
 *         description: Адрес обновлён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 address:
 *                   $ref: '#/components/schemas/Address'
 *       403:
 *         description: Нет доступа
 *       404:
 *         description: Адрес не найден
 *   delete:
 *     tags: [Address]
 *     summary: Удалить адрес (если дефолтный — следующий становится дефолтным)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Адрес удалён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Нет доступа
 *       404:
 *         description: Адрес не найден
 *
 * /addresses/{id}/default:
 *   patch:
 *     tags: [Address]
 *     summary: Установить адрес как основной
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Адрес установлен как основной
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 address:
 *                   $ref: '#/components/schemas/Address'
 *       403:
 *         description: Нет доступа
 *       404:
 *         description: Адрес не найден
 */

router.get("/", authMiddleware, address.getAddresses);
router.post("/", authMiddleware, address.createAddress);
router.patch("/:id", authMiddleware, address.updateAddress);
router.patch("/:id/default", authMiddleware, address.setDefault);
router.delete("/:id", authMiddleware, address.deleteAddress);

export default router;
