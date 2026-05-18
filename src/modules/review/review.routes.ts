import { Router } from "express";
import * as review from "./review.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ReviewUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *           nullable: true
 *         avatar:
 *           type: string
 *           nullable: true
 *
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         productId:
 *           type: integer
 *         storeId:
 *           type: integer
 *           nullable: true
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           nullable: true
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         isApproved:
 *           type: boolean
 *         user:
 *           $ref: '#/components/schemas/ReviewUser'
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     RatingDistribution:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *         _count:
 *           type: object
 *           properties:
 *             rating:
 *               type: integer
 *
 *     CreateReviewInput:
 *       type: object
 *       required: [productId, rating]
 *       properties:
 *         productId:
 *           type: integer
 *         storeId:
 *           type: integer
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           minLength: 5
 *           maxLength: 1000
 *           nullable: true
 *
 * /reviews/product/{productId}:
 *   get:
 *     tags: [Review]
 *     summary: Отзывы на товар
 *     parameters:
 *       - in: path
 *         name: productId
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Отзывы с пагинацией и распределением рейтингов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 ratingDistribution:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RatingDistribution'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *
 * /reviews:
 *   post:
 *     tags: [Review]
 *     summary: Оставить отзыв на товар
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewInput'
 *     responses:
 *       201:
 *         description: Отзыв добавлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Товар не найден
 *       409:
 *         description: Отзыв уже оставлен
 *
 * /reviews/my:
 *   get:
 *     tags: [Review]
 *     summary: Мои отзывы
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список моих отзывов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *
 * /reviews/{id}:
 *   delete:
 *     tags: [Review]
 *     summary: Удалить отзыв
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
 *         description: Отзыв удалён
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
 *         description: Отзыв не найден
 */

// Публичные
router.get("/product/:productId", review.getProductReviews);

// Авторизованные
router.post("/", authMiddleware, review.createReview);
router.get("/my", authMiddleware, review.getMyReviews);
router.delete("/:id", authMiddleware, review.deleteReview);

export default router;
