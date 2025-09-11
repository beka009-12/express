import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";

const router = Router();

// Роуты авторизации
router.use("/auth", authRoutes);

// Можно подключать другие модули, например:
// router.use("/products", productsRoutes);

export default router;
