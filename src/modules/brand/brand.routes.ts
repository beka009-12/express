import { Router } from "express";
import * as brandControllers from "./brand.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/get-brands", authMiddleware, brandControllers.getBrands);
router.get("/get-brand/:id", authMiddleware, brandControllers.getBrandById);
router.post("/create-brand", authMiddleware, brandControllers.createBrand);
router.put("/update-brand/:id", authMiddleware, brandControllers.updateBrand);
router.delete(
  "/delete-brand/:id",
  authMiddleware,
  brandControllers.deleteBrand
);

export default router;
