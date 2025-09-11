import { Router } from "express";
import cors from "cors";
import authRoutes from "../modules/auth/auth.routes";

const configCors = {
  origin: ["http://localhost:3000", "https://shop-indol-alpha.vercel.app"],
};

const router = Router();

router.use("/auth", cors(configCors), authRoutes);

export default router;
