import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import shopsRoutes from "../modules/shops/shops.routes";
import userRoutes from "../modules/user/user.routes";
import productRoutes from "../modules/product/product.routes";
import reviewRoutes from "../modules/review/review.routes";
import cartRoutes from "../modules/cart/cart.routes";
import addressRoutes from "../modules/address/address.routes";
import fileRoutes from "../modules/upload/upload.routes";
import categoryRoutes from "../modules/category/category.routes";
import orderRoutes from "../modules/order/order.routes";
import favoriteRoutes from "../modules/favorite/favorite.routes";
import searchRoutes from "../modules/search/search.routes";
import bannerRoutes from "../modules/banner/banner.routes";
import promoCodeRoutes from "../modules/promo-code/promo-code.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/shops", shopsRoutes);
router.use("/user", userRoutes);
router.use("/commodity", productRoutes);
router.use("/reviews", reviewRoutes);
router.use("/cart", cartRoutes);
router.use("/addresses", addressRoutes);
router.use("/upload", fileRoutes);
router.use("/category", categoryRoutes);
router.use("/order", orderRoutes);
router.use("/favorite", favoriteRoutes);
router.use("/search", searchRoutes);
router.use("/banner", bannerRoutes);
router.use("/promo-code", promoCodeRoutes);

export default router;
