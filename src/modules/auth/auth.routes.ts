import { Router } from "express";
import * as authControllers from "./auth.controllers";

const router = Router();

// todo Защищённый маршрут

// ! POST
router.post("/sign-up", authControllers.register);
router.post("/sign-in", authControllers.login);
router.post("/logout", authControllers.logout);
// ! GET
// ! PUT
router.put("/profile-update", authControllers.updateProfile);

export default router;
