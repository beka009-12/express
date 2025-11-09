import { Router } from "express";
import * as sallerRouter from "./saller.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// todo Защищённый маршрут

// ! POST
router.post("/sign-up-saller", sallerRouter.signUpSeller);
router.post("/sign-in-saller", sallerRouter.signInSeller);
router.post("/create-store", authMiddleware, sallerRouter.createStore);
router.post("/refresh-token-saller", sallerRouter.refreshTokenSeller);
router.post("/logout-saller", authMiddleware, sallerRouter.logoutSeller);
// ! GET
router.get("/saller-profile", authMiddleware, sallerRouter.getProfileSeller);

export default router;
