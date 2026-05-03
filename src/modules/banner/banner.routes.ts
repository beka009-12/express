import { Router } from "express";
import {
  approveBanner,
  createBanner,
  getActiveBanners,
  rejectBanner,
} from "./banner.controller";

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     PromoType:
 *       type: string
 *       enum: [PERCENT, FIXED_PRICE, BUY_ONE_GET, SEASONAL]
 *
 *     BannerStatus:
 *       type: string
 *       enum: [PENDING, APPROVED, REJECTED]
 *
 *     BannerProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 42
 *         title:
 *           type: string
 *           example: "Nike Air Max"
 *         price:
 *           type: string
 *           example: "12000.00"
 *         newPrice:
 *           type: string
 *           nullable: true
 *           example: "9600.00"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *
 *     BannerSlot:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         price:
 *           type: number
 *           example: 500
 *         isPaid:
 *           type: boolean
 *         startAt:
 *           type: string
 *           format: date-time
 *         endAt:
 *           type: string
 *           format: date-time
 *
 *     BannerProductEntry:
 *       type: object
 *       properties:
 *         originalPrice:
 *           type: string
 *           example: "12000.00"
 *         product:
 *           $ref: '#/components/schemas/BannerProduct'
 *
 *     BannerItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         storeId:
 *           type: integer
 *           example: 7
 *         title:
 *           type: string
 *           example: "Летняя распродажа"
 *         accent:
 *           type: string
 *           example: "ДО -30%"
 *         description:
 *           type: string
 *           example: "Скидки на всю летнюю коллекцию"
 *         decoNum:
 *           type: string
 *           example: "30"
 *         promoTag:
 *           type: string
 *           example: "SALE"
 *         color:
 *           type: string
 *           example: "#FF5733"
 *         promoType:
 *           $ref: '#/components/schemas/PromoType'
 *         discount:
 *           type: integer
 *           nullable: true
 *           example: 30
 *         fixedPrice:
 *           type: number
 *           nullable: true
 *           example: null
 *         deadline:
 *           type: string
 *           format: date-time
 *           example: "2025-08-01T00:00:00.000Z"
 *         isActive:
 *           type: boolean
 *         status:
 *           $ref: '#/components/schemas/BannerStatus'
 *         rejectReason:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         store:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "TopShop KG"
 *             isVerified:
 *               type: boolean
 *         products:
 *           type: array
 *           maxItems: 3
 *           items:
 *             $ref: '#/components/schemas/BannerProductEntry'
 *         slot:
 *           $ref: '#/components/schemas/BannerSlot'
 *
 *     CreateBannerInput:
 *       type: object
 *       required:
 *         - title
 *         - accent
 *         - description
 *         - decoNum
 *         - promoTag
 *         - color
 *         - promoType
 *         - deadline
 *         - productIds
 *       properties:
 *         title:
 *           type: string
 *           example: "Летняя распродажа"
 *         accent:
 *           type: string
 *           example: "ДО -30%"
 *         description:
 *           type: string
 *           example: "Скидки на всю летнюю коллекцию"
 *         decoNum:
 *           type: string
 *           example: "30"
 *         promoTag:
 *           type: string
 *           example: "SALE"
 *         color:
 *           type: string
 *           example: "#FF5733"
 *         promoType:
 *           $ref: '#/components/schemas/PromoType'
 *         discount:
 *           type: integer
 *           minimum: 1
 *           maximum: 99
 *           example: 30
 *           description: "Обязателен при promoType=PERCENT"
 *         fixedPrice:
 *           type: number
 *           example: 999.99
 *           description: "Обязателен при promoType=FIXED_PRICE"
 *         deadline:
 *           type: string
 *           format: date-time
 *           example: "2025-08-01T00:00:00.000Z"
 *         productIds:
 *           type: array
 *           items:
 *             type: integer
 *           minItems: 1
 *           example: [1, 2, 3]
 *         promoCode:
 *           type: string
 *           example: "SUMMER2025"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Ошибка сервера"
 *
 * tags:
 *   - name: Banner
 *     description: Управление рекламными баннерами
 *
 * /banner/active:
 *   get:
 *     tags: [Banner]
 *     summary: Получить активные баннеры
 *     description: >
 *       Возвращает до 5 активных, одобренных и оплаченных баннеров
 *       в случайном порядке.
 *     responses:
 *       200:
 *         description: Список активных баннеров
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 banners:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BannerItem'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /banner/{storeId}:
 *   post:
 *     tags: [Banner]
 *     summary: Создать баннер для магазина
 *     description: >
 *       Создаёт баннер и слот оплаты. Если у магазина уже есть
 *       активный баннер (PENDING или APPROVED), вернёт 400.
 *       При передаче promoCode применяется скидка на стоимость размещения.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 7
 *         description: ID магазина владельца
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBannerInput'
 *     responses:
 *       201:
 *         description: Баннер успешно создан (статус PENDING, ожидает одобрения)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 banner:
 *                   $ref: '#/components/schemas/BannerItem'
 *       400:
 *         description: >
 *           Невалидный запрос. Возможные причины:
 *           у магазина уже есть активный баннер;
 *           переданы productIds чужих или несуществующих товаров.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               activeBannerExists:
 *                 summary: Активный баннер уже существует
 *                 value:
 *                   message: "У вашего магазина уже есть активный баннер."
 *               invalidProducts:
 *                 summary: Чужие или несуществующие товары
 *                 value:
 *                   message: "Некоторые товары не найдены или не принадлежат вашему магазину."
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /banner/{id}/approve:
 *   patch:
 *     tags: [Banner]
 *     summary: Одобрить баннер (admin)
 *     description: Переводит баннер в статус APPROVED и делает его isActive=true.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID баннера
 *     responses:
 *       200:
 *         description: Баннер одобрен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 banner:
 *                   $ref: '#/components/schemas/BannerItem'
 *       404:
 *         description: Баннер не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /banner/{id}/reject:
 *   patch:
 *     tags: [Banner]
 *     summary: Отклонить баннер (admin)
 *     description: Переводит баннер в статус REJECTED с указанием причины.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID баннера
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Изображение не соответствует правилам платформы"
 *     responses:
 *       200:
 *         description: Баннер отклонён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 banner:
 *                   $ref: '#/components/schemas/BannerItem'
 *       400:
 *         description: Не указана причина отклонения
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Необходимо указать причину отклонения"
 *       404:
 *         description: Баннер не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const bannerRouter = Router();

bannerRouter.get("/active", getActiveBanners);
bannerRouter.post("/:storeId", createBanner);
bannerRouter.patch("/:id/approve", approveBanner);
bannerRouter.patch("/:id/reject", rejectBanner);

export default bannerRouter;
