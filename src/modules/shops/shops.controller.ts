import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { shopsService } from "./shops.service";
import {
  CreateShopSchema,
  UpdateShopSchema,
  ShopsListQuerySchema,
  ShopProductsQuerySchema,
} from "./shops.validation";

// Проверка что пользователь авторизован и имеет роль OWNER
function requireOwner(
  req: AuthRequest,
  res: Response,
): req is AuthRequest & { user: { id: number; role: string } } {
  if (!req.user?.id) {
    res.status(401).json({ message: "Не авторизован" });
    return false;
  }
  if (req.user.role !== "OWNER") {
    res.status(403).json({ message: "Доступ только для владельцев магазинов" });
    return false;
  }
  return true;
}

export const createShop = async (req: AuthRequest, res: Response) => {
  if (!requireOwner(req, res)) return;

  try {
    const dto = CreateShopSchema.parse(req.body);
    const shop = await shopsService.createShop(req.user!.id, dto);
    return res.status(201).json({ message: "Магазин создан", shop });
  } catch (err: any) {
    console.error("Create shop error:", err);
    if (err.message === "SHOP_EXISTS")
      return res.status(409).json({ message: "У вас уже есть магазин" });
    return res.status(400).json({ message: err.message || "Ошибка при создании магазина" });
  }
};

export const getAllShops = async (req: AuthRequest, res: Response) => {
  try {
    const query = ShopsListQuerySchema.parse(req.query);
    const result = await shopsService.getAllShops(query);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Get all shops error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const getMyShop = async (req: AuthRequest, res: Response) => {
  if (!requireOwner(req, res)) return;

  try {
    const shop = await shopsService.getMyShop(req.user!.id);
    return res.status(200).json({ shop });
  } catch (err: any) {
    console.error("Get my shop error:", err);
    if (err.message === "SHOP_NOT_FOUND")
      return res.status(404).json({ message: "Магазин не найден" });
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const getShopById = async (req: AuthRequest, res: Response) => {
  try {
    const shopId = Number(req.params.id);
    if (!shopId || isNaN(shopId))
      return res.status(400).json({ message: "Неверный ID магазина" });

    const query = ShopProductsQuerySchema.parse(req.query);
    const result = await shopsService.getShopById(shopId, query);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Get shop by id error:", err);
    if (err.message === "SHOP_NOT_FOUND")
      return res.status(404).json({ message: "Магазин не найден" });
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const updateShop = async (req: AuthRequest, res: Response) => {
  if (!requireOwner(req, res)) return;

  try {
    const dto = UpdateShopSchema.parse(req.body);
    const shop = await shopsService.updateShop(req.user!.id, dto);
    return res.status(200).json({ message: "Магазин обновлён", shop });
  } catch (err: any) {
    console.error("Update shop error:", err);
    if (err.message === "SHOP_NOT_FOUND")
      return res.status(404).json({ message: "Магазин не найден" });
    return res.status(400).json({ message: err.message || "Ошибка при обновлении магазина" });
  }
};

export const deactivateShop = async (req: AuthRequest, res: Response) => {
  if (!requireOwner(req, res)) return;

  try {
    const result = await shopsService.deactivateShop(req.user!.id);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Deactivate shop error:", err);
    if (err.message === "SHOP_NOT_FOUND")
      return res.status(404).json({ message: "Магазин не найден" });
    if (err.message === "SHOP_ALREADY_INACTIVE")
      return res.status(400).json({ message: "Магазин уже деактивирован" });
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const reactivateShop = async (req: AuthRequest, res: Response) => {
  if (!requireOwner(req, res)) return;

  try {
    const result = await shopsService.reactivateShop(req.user!.id);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Reactivate shop error:", err);
    if (err.message === "SHOP_NOT_FOUND")
      return res.status(404).json({ message: "Магазин не найден" });
    if (err.message === "SHOP_ALREADY_ACTIVE")
      return res.status(400).json({ message: "Магазин уже активен" });
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};
