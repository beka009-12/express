import { Router } from "express";
import * as favorite from "./favorite.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     FavoriteProduct:
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
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *
 *     FavoriteItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         productId:
 *           type: integer
 *         product:
 *           $ref: '#/components/schemas/FavoriteProduct'
 *
 *     AddFavoriteInput:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: integer
 *
 * /favorite/favorite-add:
 *   post:
 *     tags: [Favorite]
 *     summary: Добавить в избранное
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddFavoriteInput'
 *     responses:
 *       201:
 *         description: Добавлено в избранное
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 favorite:
 *                   $ref: '#/components/schemas/FavoriteItem'
 *
 * /favorite/favorite/{userId}:
 *   get:
 *     tags: [Favorite]
 *     summary: Получить избранное пользователя
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
 *         description: Список избранного
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FavoriteItem'
 *
 * /favorite/favorite-delete/{productId}:
 *   delete:
 *     tags: [Favorite]
 *     summary: Удалить из избранного
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
 *         description: Удалено из избранного
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.post("/favorite-add", authMiddleware, favorite.addFavorite);
router.get("/favorite/:userId", authMiddleware, favorite.getFavorites);

router.delete(
  "/favorite-delete/:productId",
  authMiddleware,
  favorite.deleteFavorite,
);

export default router;
