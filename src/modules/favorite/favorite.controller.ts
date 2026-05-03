import { Response } from "express";
import { prisma } from "../../prisma";
import { Prisma } from "@prisma/client";
import { AuthRequest } from "../../middleware/auth.middleware";

// POST /favorites
const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsedProductId = Number(req.body.productId);

    if (!parsedProductId || isNaN(parsedProductId)) {
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
      data: { userId, productId: parsedProductId },
    });

    return res.status(201).json({ message: "Успешно добавлен", favorite });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Продукт уже в избранном" });
      }
    }
    console.error("addFavorite error:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// GET /favorites
const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            newPrice: true,
            images: true,
            isActive: true,
          },
        },
      },
    });

    return res.status(200).json({ favorites });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// DELETE /favorites/:productId
const deleteFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsedProductId = Number(req.params.productId);

    if (!parsedProductId || isNaN(parsedProductId)) {
      return res.status(400).json({ message: "Некорректный productId" });
    }

    const result = await prisma.favorite.deleteMany({
      where: { userId, productId: parsedProductId },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Товар не в избранном" });
    }

    return res.status(200).json({ message: "Успешно удалено" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { addFavorite, getFavorites, deleteFavorite };
