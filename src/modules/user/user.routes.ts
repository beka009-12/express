import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as userControllers from "./user.controller";
const router = Router();

// ! GET
router.get("/profile", authMiddleware, userControllers.getProfileController);
// ! PUT
router.put("/profile", authMiddleware, userControllers.updateProfileController);

export default router;
