import { Router } from "express";
import authControllers from "./auth.controllers";
import { authMiddleware } from "./authMiddleware";

const router = Router();

router.post("/register", authControllers.signUpUser);
router.post("/login", authControllers.signInUser);
router.post("/googleAuth", authControllers.googleAuth);
router.get("/me", authMiddleware(["USER", "OWNER"]), (req, res) => {
  res.json({ user: (req as any).user });
});

export default router;
