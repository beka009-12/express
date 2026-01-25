import { Router } from "express";
import * as orderControllers from "./order.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.post("/create-order", orderControllers.sendOrder);
router.get("/cart/:userId", orderControllers.getCart);
router.delete("/delete-all-cart/:userId", orderControllers.deleteAllCart);
router.delete(
  "/delete-by-id/:productId",
  authMiddleware,
  orderControllers.deleteById,
);

export default router;
