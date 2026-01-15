import { Request, Response } from "express";
import { prisma } from "../../prisma";
import { AuthRequest } from "../../middleware/auth.middleware";

const createFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    if (!productId) {
      return res.status(400).json({ message: "productId обязателен" });
    }

    const pid = Number(productId);

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: pid,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ message: "Уже в избранном" });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId: pid,
      },
    });

    return res.status(201).json({
      message: "Добавлено в избранное",
      favorite,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const deleteFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    if (!productId) {
      return res.status(400).json({ message: "productId обязателен" });
    }

    const pid = Number(productId);

    const deleted = await prisma.favorite.deleteMany({
      where: {
        userId,
        productId: pid,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ message: "Не найдено в избранном" });
    }

    return res.status(200).json({ message: "Удалено из избранного" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { createFavorite, deleteFavorite };
