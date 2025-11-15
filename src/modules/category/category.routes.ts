import { Router } from "express";
import * as categoryControllers from "./category.controllers";

const router = Router();

router.get("/categories", categoryControllers.getCategory);

export default router;
