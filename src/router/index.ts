import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import sallerRoutes from "../modules/saller/saller.routes";
import productRoutes from "../modules/product/product.routes";
import fileRoutes from "../modules/upload/upload.routes";
import categoryRoutes from "../modules/category/category.routes";
import orderRoutes from "../modules/order/order.routes";
import favoriteRoutes from "../modules/favorite/favorite.routes";
import searchRoutes from "../modules/search/search.routes";
import bannerRoutes from "../modules/banner/banner.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/saller", sallerRoutes);
router.use("/commodity", productRoutes);
router.use("/upload", fileRoutes);
router.use("/category", categoryRoutes);
router.use("/order", orderRoutes);
router.use("/favorite", favoriteRoutes);
router.use("/search", searchRoutes);
router.use("/banner", bannerRoutes);

export default router;
