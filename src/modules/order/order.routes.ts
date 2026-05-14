import { Router } from "express";
import * as orderControllers from "./order.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CartProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         price:
 *           type: number
 *         description:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         stockCount:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         colors:
 *           type: array
 *           items:
 *             type: string
 *         sizes:
 *           type: array
 *           items:
 *             type: string
 *         brandName:
 *           type: string
 *           nullable: true
 *         categoryId:
 *           type: integer
 *
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         productId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         product:
 *           $ref: '#/components/schemas/CartProduct'
 *
 *     AddToCartInput:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: integer
 *         quantity:
 *           type: integer
 *           minimum: 1
 *
 * /order/create-order:
 *   post:
 *     tags: [Order]
 *     summary: Добавить товар в корзину
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartInput'
 *     responses:
 *       201:
 *         description: Товар добавлен в корзину
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 *       200:
 *         description: Количество обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 *
 * /order/cart/{userId}:
 *   get:
 *     tags: [Order]
 *     summary: Получить корзину пользователя
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Корзина пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CartItem'
 *
 * /order/delete-all-cart/{userId}:
 *   delete:
 *     tags: [Order]
 *     summary: Очистить корзину
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Корзина очищена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *
 * /order/delete-by-id/{productId}:
 *   delete:
 *     tags: [Order]
 *     summary: Удалить товар из корзины
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Товар удалён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 */

// ? POST
router.post("/create-order", authMiddleware, orderControllers.createOrder);
router.post("/cancel/:orderId", authMiddleware, orderControllers.cancelOrder);

// ? GET
router.get("/my-orders", authMiddleware, orderControllers.getUserOrders);
router.get("/:orderId", authMiddleware, orderControllers.getOrderById);

export default router;
