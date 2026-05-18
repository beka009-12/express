import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { CartService } from "./cart.service";

const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const productId = Number(req.body.productId);
    const quantity = req.body.quantity ? Number(req.body.quantity) : 1;

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Неверный ID товара" });
    }

    const item = await CartService.addToCart(req.user!.id, productId, quantity);
    return res.status(201).json({ message: "Товар добавлен в корзину", item });
  } catch (error: any) {
    console.error("addToCart error:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("наличии") || error.message.includes("больше 0")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const cart = await CartService.getCart(req.user!.id);
    return res.status(200).json(cart);
  } catch (error) {
    console.error("getCart error:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const updateQuantity = async (req: AuthRequest, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const quantity = Number(req.body.quantity);

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Неверный ID товара" });
    }

    if (!quantity || isNaN(quantity)) {
      return res.status(400).json({ message: "Укажите количество" });
    }

    const item = await CartService.updateQuantity(req.user!.id, productId, quantity);
    return res.status(200).json({ message: "Количество обновлено", item });
  } catch (error: any) {
    console.error("updateQuantity error:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("наличии") || error.message.includes("больше 0")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const productId = Number(req.params.productId);

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Неверный ID товара" });
    }

    const result = await CartService.removeFromCart(req.user!.id, productId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("removeFromCart error:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const result = await CartService.clearCart(req.user!.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("clearCart error:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { addToCart, getCart, updateQuantity, removeFromCart, clearCart };
