import { Router } from "express";
import * as authControllers from "./auth.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.post("/sign-up", authControllers.register);
router.post("/sign-in", authControllers.login);
router.get("/profile", authMiddleware, authControllers.getProfile);
router.post("/logaut", authMiddleware, authControllers.Logout);

export default router;
