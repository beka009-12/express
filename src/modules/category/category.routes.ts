import { Router } from "express";
import * as categoryControllers from "./category.controllers";

const router = Router();

router.get("/categories", categoryControllers.getCategories);
router.get("/categories-tree", categoryControllers.getCategoriesTree);
router.post("/create-category", categoryControllers.createCategory);
router.put("/update-category/:id", categoryControllers.updateCategory);
router.delete("/delete-category/:id", categoryControllers.deleteCategory);
export default router;
