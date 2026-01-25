import { Request, Response } from "express";
import { prisma } from "../../prisma";
import { AuthRequest } from "../../middleware/auth.middleware";

const sendOrder = async (req: Request, res: Response) => {
  try {
    const { userId, items } = req.body;

    if (!userId || !items || !items.length) {
      return res.status(400).json({ message: "Неверные данные" });
    }

    const { productId, quantity } = items[0];

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Неверные данные" });
    }

    const existingCartAlready = await prisma.cart.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingCartAlready) {
      return res.status(409).json({ message: "Товар уже в корзине" });
    }

    const newCartItem = await prisma.cart.create({
      data: { userId, productId },
    });

    return res.status(201).json(newCartItem);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) return res.status(400).json({ message: "Не указан userId" });

    const cart = await prisma.cart.findMany({
      where: { userId: Number(userId) },
      include: {
        product: true,
      },
    });

    return res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const deleteAllCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Не указан userId" });
    }

    const result = await prisma.cart.deleteMany({
      where: { userId: Number(userId) },
    });

    return res.status(200).json({
      message: "Корзина очищена",
      deletedCount: result.count,
    });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const deleteById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Не указан productId" });
    }

    const result = await prisma.cart.deleteMany({
      where: {
        userId,
        productId: Number(productId),
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Товар не найден в корзине" });
    }

    return res.status(200).json({
      message: "Товар удалён из корзины",
      deletedCount: result.count,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { sendOrder, getCart, deleteAllCart, deleteById };
