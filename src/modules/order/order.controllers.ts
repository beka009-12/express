import { Request, Response } from "express";
import { prisma } from "../../prisma";
import { AuthRequest } from "../../middleware/auth.middleware";

const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Неверные данные" });
    }

    const numProductId = Number(productId);

    const product = await prisma.product.findUnique({
      where: { id: numProductId },
    });

    if (!product || !product.isActive || product.archivedAt) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    const existing = await prisma.cart.findUnique({
      where: {
        userId_productId: {
          userId: userId!,
          productId: numProductId,
        },
      },
    });

    if (existing) {
      const updated = await prisma.cart.update({
        where: {
          userId_productId: { userId: userId!, productId: numProductId },
        },
        data: { quantity: existing.quantity + quantity },
      });
      return res.status(200).json(updated);
    }

    const cartItem = await prisma.cart.create({
      data: { userId: userId!, productId: numProductId, quantity },
    });

    return res.status(201).json(cartItem);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(400).json({ message: "Не указан userId" });

    const cart = await prisma.cart.findMany({
      where: { userId: Number(userId) },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            description: true,
            images: true,
            stockCount: true,
            isActive: true,
            color: true,
            size: true,
            brandName: true,
            categoryId: true,
          },
        },
      },
    });

    return res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const deleteAllCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await prisma.cart.deleteMany({
      where: { userId },
    });

    return res.status(200).json({
      message: "Корзина очищена",
      deletedCount: result.count,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const deleteById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const productId = Number(req.params.productId);

    if (!productId) {
      return res.status(400).json({ message: "Не указан productId" });
    }

    const result = await prisma.cart.deleteMany({
      where: { userId, productId },
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

export { addToCart, getCart, deleteAllCart, deleteById };
