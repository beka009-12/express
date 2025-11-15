import { Router } from "express";
import * as brandControllers from "./brand.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/get-brands", authMiddleware, brandControllers.getBrands);
router.post("/create-brand", authMiddleware, brandControllers.createBrands);
router.put("/update-brand/:id", authMiddleware, brandControllers.updateBrand);
router.delete(
  "/delete-brand/:id",
  authMiddleware,
  brandControllers.deleteBrand
);

export default router;
