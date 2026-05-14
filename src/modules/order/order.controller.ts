import { Request, Response } from "express";
import { orderService } from "./order.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { CreateOrderDto } from "./order.validation";

const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const dto: CreateOrderDto = req.body;

    // Можно добавить базовую валидацию здесь
    if (!dto.deliveryMethod) {
      return res.status(400).json({
        message: "Метод доставки обязателен",
      });
    }

    const result = await orderService.createOrder(userId, dto);

    return res.status(201).json({
      success: true,
      message: "Заказ успешно создан",
      data: result,
    });
  } catch (err: any) {
    console.error("Create order error:", err);

    // Обработка известных ошибок
    if (err.message.includes("Корзина пуста")) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.includes("Адрес доставки не найден")) {
      return res.status(400).json({ message: err.message });
    }
    if (
      err.message.includes("недостаточно товара") ||
      err.message.includes("больше не доступен")
    ) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({
      message: "Ошибка при создании заказа",
    });
  }
};

// Получение заказов пользователя
const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, page = 1, limit = 10 } = req.query;

    const orders = await orderService.getUserOrders(userId, {
      status: status as any,
      page: Number(page),
      limit: Number(limit),
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: "Заказы не найдены" });
    }

    return res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const orderId = Number(req.params.orderId);

    const order = await orderService.getOrderById(userId, orderId);

    return res.status(200).json(order);
  } catch (err: any) {
    if (err.message.includes("не найден")) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const orderId = Number(req.params.orderId);

    await orderService.cancelOrder(userId, orderId);

    return res.status(200).json({
      success: true,
      message: "Заказ успешно отменён",
    });
  } catch (err: any) {
    if (err.message.includes("не найден")) {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes("нельзя отменить")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { createOrder, getUserOrders, getOrderById, cancelOrder };
