import { Request, Response } from "express";
import { prisma } from "../../prisma";
import { Prisma } from "@prisma/client";
import { AuthRequest } from "../../middleware/auth.middleware";

const addFavorite = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;
    if (!userId) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    const parsedProductId = Number(productId);

    if (!parsedProductId || Number.isNaN(parsedProductId)) {
      return res.status(400).json({ message: "Некорректный productId" });
    }

    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
      select: { id: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Продукт не найден" });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId: parsedProductId,
      },
    });

    return res.status(200).json({
      message: "Успешно добавлен",
      favorite,
    });
  } catch (error) {
    // защита от дубля
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Продукт уже в избранном",
        });
      }
    }

    console.error("addFavorite error:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getFavorite = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.userId);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Неверный ID пользователя" });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: id },
      include: { product: true },
    });

    return res
      .status(200)
      .json({ message: "Успешно получены избранные продукты", favorites });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const deleteFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;

    const parsedProductId = Number(productId);

    if (!parsedProductId || Number.isNaN(parsedProductId)) {
      return res.status(400).json({ message: "Некорректный productId" });
    }

    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
      select: { id: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Продукт не найден" });
    }

    const result = await prisma.favorite.deleteMany({
      where: {
        userId,
        productId: parsedProductId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Товар не в избранном" });
    }

    return res.status(200).json({ message: "Успешно удалено" });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { addFavorite, getFavorite, deleteFavorite };
