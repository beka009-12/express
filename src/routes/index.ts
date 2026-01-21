import { Router } from "express";
import cors from "cors";
import authRoutes from "../modules/auth/auth.routes";
import sallerRouts from "../modules/saller/saller.routes";
import product from "../modules/product/product.routes";
import file from "../modules/upload/upload.routes";
import categoryRoutes from "../modules/category/category.routes";

const configCors = {
  origin: [
    "http://localhost:3000",
    "https://shop-one-bay.vercel.app",
    "https://seller-point.vercel.app",
    "http://localhost:3001",
  ],
};

const router = Router();

router.use("/auth", cors(configCors), authRoutes);
router.use("/saller", cors(configCors), sallerRouts);
router.use("/commodity", cors(configCors), product);
router.use("/upload", cors(configCors), file);
router.use("/category", cors(configCors), categoryRoutes);

export default router;
