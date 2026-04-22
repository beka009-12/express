import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import sallerRouts from "../modules/saller/saller.routes";
import product from "../modules/product/product.routes";
import file from "../modules/upload/upload.routes";
import categoryRoutes from "../modules/category/category.routes";
import order from "../modules/order/order.routes";
import favorite from "../modules/favorite/favorite.routes";
import searchRoutes from "../modules/search/search.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/saller", sallerRouts);
router.use("/commodity", product);
router.use("/upload", file);
router.use("/category", categoryRoutes);
router.use("/order", order);
router.use("/favorite", favorite);
router.use("/search", searchRoutes);

export default router;
