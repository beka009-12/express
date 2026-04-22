import { Router } from "express";
import * as categoryControllers from "./category.controllers";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CategoryWithCount:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         parentId:
 *           type: integer
 *           nullable: true
 *         parent:
 *           $ref: '#/components/schemas/Category'
 *           nullable: true
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         _count:
 *           type: object
 *           properties:
 *             products:
 *               type: integer
 *
 *     CreateCategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         parentId:
 *           type: integer
 *           nullable: true
 *
 * /category/categories:
 *   get:
 *     tags: [Category]
 *     summary: Получить все категории
 *     responses:
 *       200:
 *         description: Список категорий
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryWithCount'
 *
 * /category/categories-tree:
 *   get:
 *     tags: [Category]
 *     summary: Получить дерево категорий
 *     responses:
 *       200:
 *         description: Дерево категорий
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryWithCount'
 *
 * /category/create-category:
 *   post:
 *     tags: [Category]
 *     summary: Создать категорию
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       201:
 *         description: Категория создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 category:
 *                   $ref: '#/components/schemas/CategoryWithCount'
 *
 * /category/update-category/{id}:
 *   put:
 *     tags: [Category]
 *     summary: Обновить категорию
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
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       200:
 *         description: Категория обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 category:
 *                   $ref: '#/components/schemas/CategoryWithCount'
 *
 * /category/delete-category/{id}:
 *   delete:
 *     tags: [Category]
 *     summary: Удалить категорию
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Категория удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get("/categories", categoryControllers.getCategories);
router.get("/categories-tree", categoryControllers.getCategoriesTree);
router.post("/create-category", categoryControllers.createCategory);
router.put("/update-category/:id", categoryControllers.updateCategory);
router.delete("/delete-category/:id", categoryControllers.deleteCategory);
export default router;
