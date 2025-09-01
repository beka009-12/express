import { Router } from "express";
import authControllers from "./auth.controllers";

const router = Router();

router.post("/sign-up", authControllers.register);

export default router;
