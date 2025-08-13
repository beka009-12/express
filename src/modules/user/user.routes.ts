import { Router } from "express";
import userControllers from "./user.controllers";

const router = Router();
router.get("/get-user", userControllers.getUser);
router.post("/create-user", userControllers.userCreate);
