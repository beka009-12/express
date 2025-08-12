import { Router } from "express";
import todoPrismaControllers from "./todo.controllers";

const router = Router();

router.get("/get-all", todoPrismaControllers.getTodos);
router.get("/get/:id", todoPrismaControllers.getTodoByID);
router.post("/create", todoPrismaControllers.createTodo);
router.delete("/delete/:id", todoPrismaControllers.deleteTodo);

export default router;
