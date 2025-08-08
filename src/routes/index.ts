import { Router } from "express";
import todoRoutes from "../modules/todo/todo.routes";

const router = Router();

router.use("/todo", todoRoutes);

export default router;
