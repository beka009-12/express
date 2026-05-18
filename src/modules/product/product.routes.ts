import { Router } from "express";
import * as productControllers from "./product.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import multer from "multer";

const router = Router();
/**
 * @openapi
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         parentId:
 *           type: integer
 *           nullable: true
 *
 *     Store:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         logo:
 *           type: string
 *           nullable: true
 *         isVerified:
 *           type: boolean
 *         rating:
 *           type: number
 *           nullable: true
 *
 *     ProductImage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         url:
 *           type: string
 *         altText:
 *           type: string
 *           nullable: true
 *         isMain:
 *           type: boolean
 *         sortOrder:
 *           type: integer
 *
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         newPrice:
 *           type: number
 *           nullable: true
 *         brandName:
 *           type: string
 *           nullable: true
 *         sku:
 *           type: string
 *           nullable: true
 *         sizes:
 *           type: array
 *           items:
 *             type: string
 *         colors:
 *           type: array
 *           items:
 *             type: string
 *         material:
 *           type: string
 *           nullable: true
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, UNISEX]
 *           nullable: true
 *         season:
 *           type: string
 *           enum: [SPRING_SUMMER, AUTUMN_WINTER, ALL_SEASON]
 *           nullable: true
 *         stockCount:
 *           type: integer
 *         soldCount:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         storeId:
 *           type: integer
 *         categoryId:
 *           type: integer
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         store:
 *           $ref: '#/components/schemas/Store'
 *         productImages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 *
 *     InfiniteResponse:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         nextCursor:
 *           type: integer
 *           nullable: true
 *         hasMore:
 *           type: boolean
 *
 *     CreateProductInput:
 *       type: object
 *       required: [title, description, price, categoryId, gender, season, sizes, colors]
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         newPrice:
 *           type: number
 *           nullable: true
 *         categoryId:
 *           type: integer
 *         brandName:
 *           type: string
 *           nullable: true
 *         sizes:
 *           type: array
 *           items:
 *             type: string
 *         colors:
 *           type: array
 *           items:
 *             type: string
 *         material:
 *           type: string
 *           nullable: true
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, UNISEX]
 *         season:
 *           type: string
 *           enum: [SPRING_SUMMER, AUTUMN_WINTER, ALL_SEASON]
 *         stockCount:
 *           type: integer
 *           default: 0
 *
 * /commodity/products/infinite:
 *   get:
 *     tags: [Product]
 *     summary: Список товаров (cursor pagination)
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         description: ID последнего товара с предыдущей страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [MALE, FEMALE, UNISEX]
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           enum: [SPRING_SUMMER, AUTUMN_WINTER, ALL_SEASON]
 *       - in: query
 *         name: brandName
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, popular]
 *           default: newest
 *     responses:
 *       200:
 *         description: Товары с cursor pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InfiniteResponse'
 *
 * /commodity/products-by-category/{categoryId}:
 *   get:
 *     tags: [Product]
 *     summary: Товары по категории (включая вложенные)
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
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
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price, createdAt]
 *           default: createdAt
 *     responses:
 *       200:
 *         description: Товары категории с пагинацией
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: Категория не найдена
 *
 * /commodity/similar-products/{id}:
 *   get:
 *     tags: [Product]
 *     summary: Похожие товары (по категории, бренду, полу, сезону)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Похожие товары
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *
 * /commodity/product/user/{id}:
 *   get:
 *     tags: [Product]
 *     summary: Товар по ID (публичный)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Товар
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *
 * /commodity/product/owner/{id}:
 *   get:
 *     tags: [Product]
 *     summary: Товар по ID (для владельца магазина)
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
 *         description: Товар
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден или нет доступа
 *
 * /commodity/create-product:
 *   post:
 *     tags: [Product]
 *     summary: Создать товар (только для владельца магазина)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateProductInput'
 *               - type: object
 *                 required: [images]
 *                 properties:
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     description: Минимум 1 фото, максимум 8
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 *
 * /commodity/product-update/{id}:
 *   patch:
 *     tags: [Product]
 *     summary: Обновить товар
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
 *             $ref: '#/components/schemas/CreateProductInput'
 *     responses:
 *       200:
 *         description: Товар обновлён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       403:
 *         description: Нет доступа
 *       404:
 *         description: Товар не найден
 *
 * /commodity/product-delete/{id}:
 *   delete:
 *     tags: [Product]
 *     summary: Удалить товар (soft delete)
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
 *         description: Товар удалён
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
 *         description: Товар не найден
 */

//! create
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/create-product",
  authMiddleware,
  upload.array("images", 8),
  productControllers.createProduct,
);

//! get
router.get("/products/infinite", productControllers.getProductsInfinite);
router.get(
  "/products-by-category/:categoryId",
  productControllers.getProductsByCategory,
);
router.get(
  `/similar-products/:categoryId`,
  productControllers.getSimilarProducts,
);
//! get-by-id
router.get(
  "/product/user/:id",
  authMiddleware,
  productControllers.getProductByIdPublic,
);
router.get(
  "/product/owner/:id",
  authMiddleware,
  productControllers.getProductByIdOwner,
);
//!  update
router.patch(
  "/product-update/:id",
  authMiddleware,
  productControllers.updateProduct,
);
//! delete
router.delete(
  "/product-delete/:id",
  authMiddleware,
  productControllers.deleteProduct,
);

export default router;
