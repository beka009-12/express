import { Router } from "express";
import * as Favorite from "./favorite.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.post("/create-favorite", authMiddleware, Favorite.createFavorite);
router.delete(
  "/delete-favorite/:favoriteId",
  authMiddleware,
  Favorite.deleteFavorite
);

export default router;
