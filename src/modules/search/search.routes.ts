import { Router, Request, Response, NextFunction } from "express";
import { searchProducts } from "./search.controllers";

const router = Router();

/**
 * @openapi
 * /search/products:
 *   get:
 *     tags: [Search]
 *     summary: Поиск товаров
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поисковый запрос (fuzzy поиск по title, brandName)
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
 *     responses:
 *       200:
 *         description: Результаты поиска с пагинацией
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
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

export default router;
