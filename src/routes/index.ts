import { Router } from "express";
import cors from "cors";
import authRoutes from "../modules/auth/auth.routes";
import sallerRouts from "../modules/saller/saller.routes";
import product from "../modules/product/product.routes";
import file from "../modules/upload/upload.routes";
import categoryRoutes from "../modules/category/category.routes";
import order from "../modules/order/order.routes";
import favorite from "../modules/favorite/favorite.routes";

const configCors = {
  origin: [
    "http://localhost:3000",
    "https://shop-elafj8ft1-bekas-projects-83a573ff.vercel.app",
    "http://localhost:3001",
  ],
};

const router = Router();

router.use("/auth", cors(configCors), authRoutes);
router.use("/saller", cors(configCors), sallerRouts);
router.use("/commodity", cors(configCors), product);
router.use("/upload", cors(configCors), file);
router.use("/category", cors(configCors), categoryRoutes);
router.use("/order", cors(configCors), order);
router.use("/favorite", cors(configCors), favorite);

export default router;
