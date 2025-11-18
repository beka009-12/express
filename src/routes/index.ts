import { Router } from "express";
import cors from "cors";
import authRoutes from "../modules/auth/auth.routes";
import sallerRouts from "../modules/saller/saller.routes";
import product from "../modules/product/product.routes";
import file from "../modules/upload/upload.routes";
import categoryRoutes from "../modules/category/category.routes";
import brandRoutes from "../modules/brand/brand.routes";

const configCors = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://shop-one-bay.vercel.app",
    "https://seller-point.vercel.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

const router = Router();

router.use(cors(configCors));

router.use("/auth", authRoutes);
router.use("/saller", sallerRouts);
router.use("/commodity", product);
router.use("/upload", file);
router.use("/category", categoryRoutes);
router.use("/brand", brandRoutes);

export default router;
