import { Router } from "express";
import userControllers from "./user.controllers";

const router = Router();
router.get("/get/:id", userControllers.getUserById);
router.post("/sign-up", userControllers.signUpUser);
router.post("/sign-in", userControllers.signInUser);
router.patch("/update-user/:id", userControllers.updateUser);

export default router;
