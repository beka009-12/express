import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  createPromoCode,
  getAllPromoCodes,
  deactivatePromoCode,
  validatePromoCode,
} from "./promo-code.controller";

const promoCodeRouter = Router();

// validate must be before /:id routes to avoid route collision
promoCodeRouter.get("/validate/:code", authMiddleware, validatePromoCode);
promoCodeRouter.post("/", authMiddleware, createPromoCode);
promoCodeRouter.get("/", authMiddleware, getAllPromoCodes);
promoCodeRouter.patch("/:id/deactivate", authMiddleware, deactivatePromoCode);

export default promoCodeRouter;
