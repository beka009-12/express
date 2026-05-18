import { Router } from "express";
import * as orderControllers from "./order.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     DeliveryMethod:
 *       type: string
 *       enum: [PICKUP, COURIER_BISHKEK, COURIER_REGION, EXPRESS]
 *
 *     OrderStatus:
 *       type: string
 *       enum: [PENDING, PAID, PROCESSING, SHIPPED, COMPLETED, CANCELED]
 *
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         productId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         priceAtBuy:
 *           type: number
 *           description: Цена на момент покупки
 *         newPriceAtBuy:
 *           type: number
 *           nullable: true
 *           description: Акционная цена на момент покупки
 *
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         storeId:
 *           type: integer
 *         totalAmount:
 *           type: number
 *         deliveryCost:
 *           type: number
 *         finalAmount:
 *           type: number
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 *         deliveryMethod:
 *           $ref: '#/components/schemas/DeliveryMethod'
 *         deliveryName:
 *           type: string
 *         deliveryPhone:
 *           type: string
 *         deliveryAddress:
 *           type: string
 *         trackingNumber:
 *           type: string
 *           nullable: true
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateOrderInput:
 *       type: object
 *       required: [deliveryMethod]
 *       properties:
 *         deliveryMethod:
 *           $ref: '#/components/schemas/DeliveryMethod'
 *         addressId:
 *           type: integer
 *           description: ID адреса. Если не указан — берётся дефолтный адрес пользователя
 *         paymentMethod:
 *           type: string
 *           default: CARD
 *
 * /order/create-order:
 *   post:
 *     tags: [Order]
 *     summary: Создать заказ из корзины
 *     description: |
 *       Создаёт заказы по каждому магазину из корзины в одной транзакции.
 *       Корзина должна быть непустой, адрес доставки — существовать.
 *       После создания корзина очищается, остатки товаров уменьшаются.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderInput'
 *     responses:
 *       201:
 *         description: Заказы успешно созданы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       400:
 *         description: Корзина пуста / адрес не найден / недостаточно товара на складе
 *       401:
 *         description: Не авторизован
 *
 * /order/my-orders:
 *   get:
 *     tags: [Order]
 *     summary: Мои заказы
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/OrderStatus'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Список заказов пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       404:
 *         description: Заказы не найдены
 *
 * /order/{orderId}:
 *   get:
 *     tags: [Order]
 *     summary: Получить заказ по ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Заказ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Заказ не найден
 *
 * /order/cancel/{orderId}:
 *   post:
 *     tags: [Order]
 *     summary: Отменить заказ
 *     description: Можно отменить только заказы в статусе PENDING или PAID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Заказ отменён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Заказ нельзя отменить (статус не позволяет)
 *       404:
 *         description: Заказ не найден
 */

// ? POST
router.post("/create-order", authMiddleware, orderControllers.createOrder);
router.post("/cancel/:orderId", authMiddleware, orderControllers.cancelOrder);

// ? GET
router.get("/my-orders", authMiddleware, orderControllers.getUserOrders);
router.get("/:orderId", authMiddleware, orderControllers.getOrderById);

export default router;
