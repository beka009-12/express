import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as shopsControllers from "./shops.controller";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Shops
 *     description: Управление магазинами
 *
 * components:
 *   schemas:
 *     ShopSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         logo:
 *           type: string
 *           nullable: true
 *         region:
 *           type: string
 *           nullable: true
 *         isVerified:
 *           type: boolean
 *         rating:
 *           type: number
 *           nullable: true
 *         _count:
 *           type: object
 *           properties:
 *             products:
 *               type: integer
 *
 *     ShopDetail:
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
 *         rating:
 *           type: number
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         owner:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *               nullable: true
 *
 *     CreateShopInput:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *         address:
 *           type: string
 *           maxLength: 200
 *           nullable: true
 *         region:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *
 *     UpdateShopInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         address:
 *           type: string
 *           nullable: true
 *         region:
 *           type: string
 *           nullable: true
 *         logo:
 *           type: string
 *           format: url
 *           nullable: true
 *
 * /shops:
 *   get:
 *     tags: [Shops]
 *     summary: Список всех активных магазинов
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Список магазинов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shops:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShopSummary'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *
 * /shops/create:
 *   post:
 *     tags: [Shops]
 *     summary: Создать магазин (только OWNER, один на пользователя)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShopInput'
 *     responses:
 *       201:
 *         description: Магазин создан
 *       409:
 *         description: Магазин уже существует
 *       401:
 *         description: Не авторизован
 *
 * /shops/my:
 *   get:
 *     tags: [Shops]
 *     summary: Мой магазин (полные данные, включая isActive)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные своего магазина
 *       404:
 *         description: Магазин не найден
 *       401:
 *         description: Не авторизован
 *
 * /shops/update:
 *   patch:
 *     tags: [Shops]
 *     summary: Обновить магазин
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateShopInput'
 *     responses:
 *       200:
 *         description: Магазин обновлён
 *       404:
 *         description: Магазин не найден
 *       401:
 *         description: Не авторизован
 *
 * /shops/deactivate:
 *   patch:
 *     tags: [Shops]
 *     summary: Деактивировать магазин (все товары → неактивны, активные заказы → CANCELED)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Магазин деактивирован
 *       400:
 *         description: Магазин уже деактивирован
 *       404:
 *         description: Магазин не найден
 *       401:
 *         description: Не авторизован
 *
 * /shops/reactivate:
 *   patch:
 *     tags: [Shops]
 *     summary: Реактивировать магазин (все товары → активны, заказы не восстанавливаются)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Магазин реактивирован
 *       400:
 *         description: Магазин уже активен
 *       404:
 *         description: Магазин не найден
 *       401:
 *         description: Не авторизован
 *
 * /shops/{id}:
 *   get:
 *     tags: [Shops]
 *     summary: Детальная страница магазина с товарами (cursor pagination)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, popular]
 *           default: newest
 *     responses:
 *       200:
 *         description: Данные магазина и товары
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shop:
 *                   $ref: '#/components/schemas/ShopDetail'
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 nextCursor:
 *                   type: integer
 *                   nullable: true
 *                 hasMore:
 *                   type: boolean
 *       404:
 *         description: Магазин не найден
 */

// NOTE: /my и static-маршруты ОБЯЗАТЕЛЬНО до /:id
router.get("/my", authMiddleware, shopsControllers.getMyShop);
router.post("/create", authMiddleware, shopsControllers.createShop);
router.patch("/update", authMiddleware, shopsControllers.updateShop);
router.patch("/deactivate", authMiddleware, shopsControllers.deactivateShop);
router.patch("/reactivate", authMiddleware, shopsControllers.reactivateShop);
router.get("/:id", shopsControllers.getShopById);
router.get("/", shopsControllers.getAllShops);

export default router;
