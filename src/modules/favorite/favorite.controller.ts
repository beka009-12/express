import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { Prisma } from "@prisma/client";
import { FavoriteService } from "./favorite.service";

const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const productId = Number(req.body.productId);

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Некорректный productId" });
    }

    const favorite = await FavoriteService.addFavorite(userId, productId);

    return res.status(201).json({
      message: "Товар добавлен в избранное",
      favorite,
    });
  } catch (error: any) {
    console.error("addFavorite error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Продукт уже в избранном" });
      }
    }

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const favorites = await FavoriteService.getFavorites(userId);

    return res.status(200).json({ favorites });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const deleteFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const productId = Number(req.params.productId);

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Некорректный productId" });
    }

    await FavoriteService.deleteFavorite(userId, productId);

    return res.status(200).json({ message: "Товар удалён из избранного" });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { addFavorite, getFavorites, deleteFavorite };
