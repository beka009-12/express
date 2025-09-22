import { Router } from "express";
import * as sallerRouter from "./saller.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// todo Защищённый маршрут

// ! POST
router.post("/sign-up-saller", sallerRouter.signUpSeller);
router.post("/sign-in-saller", sallerRouter.signInSeller);
router.post("/create-store", authMiddleware, sallerRouter.createStore);
// ! GET
router.get("/saller-profile", authMiddleware, sallerRouter.getProfileSaller);

export default router;
