import { Router } from "express";
import * as favorite from "./favorite.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";
const router = Router();

router.post("/favorite-add", authMiddleware, favorite.addFavorite);
router.get("/favorite/:userId", authMiddleware, favorite.getFavorites);

router.delete(
  "/favorite-delete/:productId",
  authMiddleware,
  favorite.deleteFavorite,
);

export default router;
