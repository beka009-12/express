import { Router } from "express";
import todoPrismaControllers from "./todo.controllers";

const router = Router();

router.get("/get-all/:userId", todoPrismaControllers.getTodos);
router.get("/get/:id", todoPrismaControllers.getTodoById);
router.post("/create", todoPrismaControllers.createTodo);
router.patch("/update/:id", todoPrismaControllers.updateTodo);
router.delete("/delete", todoPrismaControllers.deleteTodo);

export default router;
