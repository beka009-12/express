import { Router } from "express";
import todoPrismaControllers from "./todo.controllers";

const router = Router();

router.get("/get-all", todoPrismaControllers.getTodos);
router.get("/createTodo", todoPrismaControllers.createTodo);
router.get("/delete/:id", todoPrismaControllers.deleteTodo);

export default router;
