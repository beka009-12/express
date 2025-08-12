import { Router } from "express";
import todoRoutes from "../modules/todo/todo.routes";
import cors from "cors";
import todoPrismaRoutes from "../modules/todo-prisma/todo.routes";

const configCors = {
  origin: ["http://localhost:3000", "https://express-nine-azure.vercel.app/"],
};

const router = Router();

router.use("/todo", cors(configCors), todoRoutes);
router.use("/todo-prisma", cors(configCors), todoPrismaRoutes);

export default router;
