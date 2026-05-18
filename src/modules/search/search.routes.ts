import { Router, Request, Response, NextFunction } from "express";
import { searchProducts, getSearchSuggestions } from "./search.controller";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SearchPagination:
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
 *         hasNextPage:
 *           type: boolean
 *         hasPrevPage:
 *           type: boolean
 *
 *     SearchMeta:
 *       type: object
 *       properties:
 *         appliedFilters:
 *           type: object
 *         sortBy:
 *           type: string
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 *
 *     SearchResponse:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         pagination:
 *           $ref: '#/components/schemas/SearchPagination'
 *         meta:
 *           $ref: '#/components/schemas/SearchMeta'
 *
 * /search/products:
 *   get:
 *     tags: [Search]
 *     summary: Поиск товаров (fuzzy по title, description, brandName)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Fuzzy-поиск по title, description, brandName
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
 *           maximum: 100
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Включает все вложенные категории
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: brandName
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: true — только товары в наличии
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
 *         name: sizes
 *         schema:
 *           type: string
 *         description: Размеры через запятую, например "S,M,L"
 *       - in: query
 *         name: colors
 *         schema:
 *           type: string
 *         description: Цвета через запятую, например "red,black"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, price, soldCount, views, newPrice]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Результаты поиска
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResponse'
 *       400:
 *         description: Невалидные параметры запроса
 *
 * /search/suggestions:
 *   get:
 *     tags: [Search]
 *     summary: Автодополнение поиска (title и brandName)
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Строка для поиска подсказок
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *           maximum: 20
 *     responses:
 *       200:
 *         description: Список подсказок
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 */

const validateSearchQuery = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit, minPrice, maxPrice, categoryId, storeId } = req.query;

  if (page && isNaN(Number(page)))
    return res.status(400).json({ message: "page must be a number" });
  if (limit && isNaN(Number(limit)))
    return res.status(400).json({ message: "limit must be a number" });
  if (minPrice && isNaN(Number(minPrice)))
    return res.status(400).json({ message: "minPrice must be a number" });
  if (maxPrice && isNaN(Number(maxPrice)))
    return res.status(400).json({ message: "maxPrice must be a number" });
  if (categoryId && isNaN(Number(categoryId)))
    return res.status(400).json({ message: "categoryId must be a number" });
  if (storeId && isNaN(Number(storeId)))
    return res.status(400).json({ message: "storeId must be a number" });

  if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
    return res
      .status(400)
      .json({ message: "minPrice cannot be greater than maxPrice" });
  }

  return next();
};

router.get("/products", validateSearchQuery, searchProducts);
router.get("/suggestions", getSearchSuggestions);

export default router;
