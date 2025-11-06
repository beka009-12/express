import { Router } from "express";
import * as brandControllers from "./brand.controllers";

const router = Router();

router.get("/get-brands", brandControllers.getBrands);
router.get("/get-brand/:id", brandControllers.getBrandById);
router.post("/create-brand", brandControllers.createBrand);
router.put("/update-brand/:id", brandControllers.updateBrand);
router.delete("/delete-brand/:id", brandControllers.deleteBrand);

export default router;
