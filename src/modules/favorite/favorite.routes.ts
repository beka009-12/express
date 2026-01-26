import { Router } from "express";
import * as favorite from "./favorite.controllers";
const router = Router();

router.post("/favorite-add", favorite.addFavorite);
export default router;
