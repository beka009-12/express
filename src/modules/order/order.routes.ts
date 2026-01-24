import { Router } from "express";
import * as orderControllers from "./order.controllers";

const router = Router();

router.post("/create-order", orderControllers.sendOrder);
router.get("/cart/:userId", orderControllers.getCart);
router.delete("/delete-all-cart/:userId", orderControllers.deleteAllCart);

export default router;
