import { Router } from "express";
import cors from "cors";
import authRoutes from "../modules/auth/auth.routes";
import sallerRouts from "../modules/saller/saller.routes";

const configCors = {
  origin: [
    "http://localhost:3000",
    "https://shop-indol-alpha.vercel.app",
    "http://localhost:3001",
  ],
};

const router = Router();

router.use("/auth", cors(configCors), authRoutes);
router.use("/saller", cors(configCors), sallerRouts);

export default router;
