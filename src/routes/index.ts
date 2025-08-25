import express from "express";
import cors from "cors";
import authRoutes from "../modules/auth/auth.routes";

const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions)); // глобально для всех маршрутов
app.use(express.json());

app.use("/auth", authRoutes);

export default app;
