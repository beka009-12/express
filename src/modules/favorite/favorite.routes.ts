import { Router } from "express";
import * as favorite from "./favorite.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";
const router = Router();

router.post("/favorite-add", favorite.addFavorite);
router.get("/favorite/:userId", favorite.getFavorite);

router.delete(
  "/favorite-delete/:productId",
  authMiddleware,
  favorite.deleteFavorite,
);

export default router;
