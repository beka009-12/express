import { Router } from "express";
import * as authControllers from "./auth.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// todo Защищённый маршрут

// ! POST
router.post("/sign-up", authControllers.register);
router.post("/sign-in", authControllers.login);
router.post("/logout", authMiddleware, authControllers.logout);
// ! GET
router.get("/profile", authMiddleware, authControllers.getProfile);
// ! PUT
router.put("/profile-update", authMiddleware, authControllers.updateProfile);

export default router;
