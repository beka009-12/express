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
 *       description: |
 *         - PERCENT — скидка в процентах (требует discount), newPrice = price - (price * discount / 100)
 *         - FIXED_PRICE — фиксированная цена (требует fixedPrice), newPrice = fixedPrice
 *         - BUY_ONE_GET — newPrice не пересчитывается
 *         - SEASONAL — newPrice не пересчитывается
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
 *           description: Оригинальная цена (Decimal → string из Prisma)
 *           example: "12000.00"
 *         newPrice:
 *           type: string
 *           nullable: true
 *           description: Пересчитанная цена после применения акции. null если promoType не влияет на цену
 *           example: "8400.00"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           example: ["https://cdn.example.com/img/air-max.jpg"]
 *
 *     BannerSlot:
 *       type: object
 *       description: Слот оплаты — один на баннер, создаётся автоматически при создании баннера
 *       properties:
 *         id:
 *           type: integer
 *           example: 15
 *         price:
 *           type: number
 *           description: |
 *             Стоимость размещения. Базовая цена 500.
 *             Снижается при применении промокода: 500 - (500 * promo.discount / 100)
 *           example: 350
 *         isPaid:
 *           type: boolean
 *           description: |
 *             true только если finalPrice === 0 (промокод дал 100% скидку).
 *             Иначе false — до подтверждения оплаты вручную.
 *           example: false
 *         startAt:
 *           type: string
 *           format: date-time
 *           description: Момент создания баннера
 *           example: "2025-06-01T10:00:00.000Z"
 *         endAt:
 *           type: string
 *           format: date-time
 *           description: Совпадает с deadline баннера
 *           example: "2025-08-01T00:00:00.000Z"
 *
 *     BannerProductEntry:
 *       type: object
 *       description: Запись промежуточной таблицы баннер ↔ товар
 *       properties:
 *         productId:
 *           type: integer
 *           example: 42
 *         originalPrice:
 *           type: string
 *           description: Snapshot цены товара на момент создания баннера
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
 *           description: HEX-цвет баннера
 *           example: "#FF5733"
 *         promoType:
 *           $ref: '#/components/schemas/PromoType'
 *         discount:
 *           type: integer
 *           nullable: true
 *           description: Процент скидки. Заполнен только при promoType=PERCENT
 *           example: 30
 *         fixedPrice:
 *           type: number
 *           nullable: true
 *           description: Фиксированная цена. Заполнена только при promoType=FIXED_PRICE
 *           example: null
 *         deadline:
 *           type: string
 *           format: date-time
 *           example: "2025-08-01T00:00:00.000Z"
 *         isActive:
 *           type: boolean
 *           example: false
 *         status:
 *           $ref: '#/components/schemas/BannerStatus'
 *         rejectReason:
 *           type: string
 *           nullable: true
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-06-01T10:00:00.000Z"
 *         store:
 *           type: object
 *           description: Присутствует только в ответе GET /banner/active
 *           properties:
 *             name:
 *               type: string
 *               example: "TopShop KG"
 *             isVerified:
 *               type: boolean
 *               example: true
 *         products:
 *           type: array
 *           description: |
 *             POST /banner/:storeId — все переданные товары.
 *             GET /banner/active — максимум 3 товара (take: 3).
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
 *           description: Обязателен при promoType=PERCENT
 *         fixedPrice:
 *           type: number
 *           example: 999.99
 *           description: Обязателен при promoType=FIXED_PRICE
 *         deadline:
 *           type: string
 *           format: date-time
 *           example: "2025-08-01T00:00:00.000Z"
 *         productIds:
 *           type: array
 *           items:
 *             type: integer
 *           minItems: 1
 *           description: |
 *             Все ID должны принадлежать магазину storeId из пути.
 *             Если хотя бы один чужой или несуществующий — вернётся 400.
 *           example: [1, 2, 3]
 *         promoCode:
 *           type: string
 *           description: |
 *             Опциональный промокод на скидку стоимости размещения.
 *             Должен быть активным (isActive=true) и не истёкшим (expiresAt > now).
 *             При успешном применении usedCount промокода увеличивается на 1.
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
 *     description: |
 *       Возвращает до 5 активных баннеров в случайном порядке.
 *       Фильтры (все обязательны): isActive=true, status=APPROVED,
 *       deadline > now, slot.isPaid=true, slot.endAt > now.
 *       Результат перемешивается (Math.random) и обрезается до 5 штук.
 *     responses:
 *       200:
 *         description: Список активных баннеров (0–5 штук)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 banners:
 *                   type: array
 *                   maxItems: 5
 *                   items:
 *                     $ref: '#/components/schemas/BannerItem'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Ошибка сервера"
 *
 * /banner/{storeId}:
 *   post:
 *     tags: [Banner]
 *     summary: Создать баннер для магазина
 *     description: |
 *       Создаёт баннер, слот оплаты и обновляет newPrice у товаров — всё в одной транзакции.
 *       Бизнес-правила:
 *       1. У магазина не должно быть активного баннера (PENDING или APPROVED) с deadline > now.
 *       2. Все productIds должны принадлежать магазину storeId.
 *       3. PERCENT — newPrice = price - (price * discount / 100).
 *       4. FIXED_PRICE — newPrice = fixedPrice для всех товаров.
 *       5. BUY_ONE_GET / SEASONAL — newPrice не изменяется.
 *       6. Промокод: slotPrice = 500 - (500 * promo.discount / 100).
 *       7. Если slotPrice === 0 — slot.isPaid сразу true.
 *       8. Созданный баннер имеет статус PENDING, isActive=false.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 7
 *         description: ID магазина-владельца баннера
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBannerInput'
 *           examples:
 *             percent:
 *               summary: Скидка в процентах
 *               value:
 *                 title: "Летняя распродажа"
 *                 accent: "ДО -30%"
 *                 description: "Скидки на всю летнюю коллекцию"
 *                 decoNum: "30"
 *                 promoTag: "SALE"
 *                 color: "#FF5733"
 *                 promoType: "PERCENT"
 *                 discount: 30
 *                 deadline: "2025-08-01T00:00:00.000Z"
 *                 productIds: [1, 2, 3]
 *                 promoCode: "SUMMER2025"
 *             fixedPrice:
 *               summary: Фиксированная цена
 *               value:
 *                 title: "Всё по 999"
 *                 accent: "ФИКС"
 *                 description: "Любой товар за 999 сом"
 *                 decoNum: "999"
 *                 promoTag: "FIXED"
 *                 color: "#2ECC71"
 *                 promoType: "FIXED_PRICE"
 *                 fixedPrice: 999
 *                 deadline: "2025-09-01T00:00:00.000Z"
 *                 productIds: [5, 6]
 *     responses:
 *       201:
 *         description: |
 *           Баннер создан. status=PENDING, isActive=false.
 *           slot.isPaid=false (кроме случая 100% скидки по промокоду).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 banner:
 *                   $ref: '#/components/schemas/BannerItem'
 *       400:
 *         description: |
 *           Невалидный запрос. Возможные причины:
 *           у магазина уже есть активный баннер (PENDING или APPROVED);
 *           в productIds переданы чужие или несуществующие товары.
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
 *         description: Не авторизован — отсутствует или невалидный JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Unauthorized"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Ошибка сервера при создании баннера"
 *
 * /banner/{id}/approve:
 *   patch:
 *     tags: [Banner]
 *     summary: Одобрить баннер (admin)
 *     description: |
 *       Переводит баннер в статус APPROVED и устанавливает isActive=true.
 *       Внимание: 404 не обрабатывается в контроллере — несуществующий id вернёт 500.
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
 *       500:
 *         description: Внутренняя ошибка сервера (включая несуществующий id)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Ошибка сервера"
 *
 * /banner/{id}/reject:
 *   patch:
 *     tags: [Banner]
 *     summary: Отклонить баннер (admin)
 *     description: |
 *       Переводит баннер в статус REJECTED, isActive=false, сохраняет rejectReason.
 *       Внимание: 404 не обрабатывается в контроллере — несуществующий id вернёт 500.
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
 *                 minLength: 1
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
 *         description: Не указана причина отклонения (reason отсутствует или falsy)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Необходимо указать причину отклонения"
 *       500:
 *         description: Внутренняя ошибка сервера (включая несуществующий id)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Ошибка сервера"
 */

const bannerRouter = Router();

bannerRouter.get("/active", getActiveBanners);
bannerRouter.post("/:storeId", createBanner);
bannerRouter.patch("/:id/approve", approveBanner);
bannerRouter.patch("/:id/reject", rejectBanner);

export default bannerRouter;
