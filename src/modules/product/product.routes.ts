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
 *         description:
 *           type: string
 *           nullable: true
 *         logo:
 *           type: string
 *           nullable: true
 *         isVerified:
 *           type: boolean
 *         rating:
 *           type: number
 *           nullable: true
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
 *         images:
 *           type: array
 *           items:
 *             type: string
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
 *         views:
 *           type: integer
 *         storeId:
 *           type: integer
 *         categoryId:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         store:
 *           $ref: '#/components/schemas/Store'
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
 *         totalPages:
 *           type: integer
 *
 *     ProductListResponse:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     CreateProductInput:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - price
 *         - categoryId
 *         - gender
 *         - season
 *         - sizes
 *         - colors
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         newPrice:
 *           type: number
 *         categoryId:
 *           type: integer
 *         brandName:
 *           type: string
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
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, UNISEX]
 *         season:
 *           type: string
 *           enum: [SPRING_SUMMER, AUTUMN_WINTER, ALL_SEASON]
 *         stockCount:
 *           type: integer
 *
 * /commodity/products:
 *   get:
 *     tags: [Product]
 *     summary: Получить товары продавца
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров магазина
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *
 * /commodity/products-for-user:
 *   get:
 *     tags: [Product]
 *     summary: Получить все товары для пользователей
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
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: brandName
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Список товаров с пагинацией
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
 *
 * /commodity/products-by-category/{categoryId}:
 *   get:
 *     tags: [Product]
 *     summary: Товары по категории
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
 *     responses:
 *       200:
 *         description: Список товаров с пагинацией
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
 *
 * /commodity/similar-products/{categoryId}:
 *   get:
 *     tags: [Product]
 *     summary: Похожие товары
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Массив похожих товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *
 * /commodity/product-for-user/{id}:
 *   get:
 *     tags: [Product]
 *     summary: Получить товар по ID
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
 *       404:
 *         description: Товар не найден
 *
 * /commodity/create-product:
 *   post:
 *     tags: [Product]
 *     summary: Создать товар
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
 *                 properties:
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
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
 *
 * /commodity/product-delete/{id}:
 *   delete:
 *     tags: [Product]
 *     summary: Удалить товар
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
