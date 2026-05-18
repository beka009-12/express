import { Router } from "express";
import * as cart from "./cart.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CartItemProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         price:
 *           type: number
 *         newPrice:
 *           type: number
 *           nullable: true
 *         stockCount:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         brandName:
 *           type: string
 *           nullable: true
 *         productImages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *         store:
 *           $ref: '#/components/schemas/Store'
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
 *           $ref: '#/components/schemas/CartItemProduct'
 *
 *     CartResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         total:
 *           type: number
 *           description: Итоговая сумма с учётом скидок
 *         count:
 *           type: integer
 *           description: Количество позиций
 *
 *     AddToCartInput:
 *       type: object
 *       required: [productId]
 *       properties:
 *         productId:
 *           type: integer
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *
 *     UpdateQuantityInput:
 *       type: object
 *       required: [quantity]
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 1
 *
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Получить корзину
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Корзина с итоговой суммой
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *   post:
 *     tags: [Cart]
 *     summary: Добавить товар в корзину (если уже есть — увеличивает количество)
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
 *         description: Товар добавлен или количество обновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 item:
 *                   $ref: '#/components/schemas/CartItem'
 *       400:
 *         description: Недостаточно товара на складе
 *       404:
 *         description: Товар не найден
 *
 * /cart/clear:
 *   delete:
 *     tags: [Cart]
 *     summary: Очистить корзину
 *     security:
 *       - bearerAuth: []
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
 *
 * /cart/{productId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Обновить количество товара в корзине
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQuantityInput'
 *     responses:
 *       200:
 *         description: Количество обновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 item:
 *                   $ref: '#/components/schemas/CartItem'
 *       400:
 *         description: Недостаточно товара на складе
 *       404:
 *         description: Товар не найден в корзине
 *   delete:
 *     tags: [Cart]
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
 *         description: Товар удалён из корзины
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Товар не найден в корзине
 */

router.get("/", authMiddleware, cart.getCart);
router.post("/", authMiddleware, cart.addToCart);
router.patch("/:productId", authMiddleware, cart.updateQuantity);
router.delete("/clear", authMiddleware, cart.clearCart);
router.delete("/:productId", authMiddleware, cart.removeFromCart);

export default router;
