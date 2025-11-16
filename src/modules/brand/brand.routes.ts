import { Router } from "express";
import * as brandControllers from "./brand.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/get-brands", authMiddleware, brandControllers.getBrands);
router.get("/get-brand/:id", brandControllers.getBrandById);

router.post("/create-brand", authMiddleware, brandControllers.createBrand);
router.patch("/update-brand/:id", authMiddleware, brandControllers.updateBrand);

export default router;
