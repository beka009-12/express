import express from "express";
import cors from "cors";
import authRoutes from "../modules/auth/auth.routes";

const app = express();

const corsOptions = {
  origin: ["http://localhost:3000", "https://hey-gold-seven.vercel.app"],
  credentials: true,
};

app.use(cors(corsOptions)); // глобально для всех маршрутов
app.use(express.json());

app.use("/api/v1/auth", authRoutes);

export default app;
