import { Router } from "express";
import * as sallerRouter from "./saller.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";
import { upload } from "../../plugin/multer";

const router = Router();

// todo Защищённый маршрут

// ! POST
router.post("/sign-up-saller", sallerRouter.signUpSeller);
router.post("/sign-in-saller", sallerRouter.signInSeller);
router.post("/logout-seller", authMiddleware, sallerRouter.logautSeller);
// ! GET
router.get("/saller-profile", authMiddleware, sallerRouter.getProfileSaller);
// ! STORE
router.post("/create-store", authMiddleware, sallerRouter.createStore);
router.post(
  "/upload-store-logo",
  upload.single("file"),
  sallerRouter.uploadStoreLogo
);

export default router;
