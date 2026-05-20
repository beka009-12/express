import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { shopsService } from "./shops.service";
import {
  CreateShopSchema,
  UpdateShopSchema,
  ShopsListQuerySchema,
  ShopProductsQuerySchema,
} from "./shops.validation";

export const createShop = async (req: AuthRequest, res: Response) => {
  try {
    const dto = CreateShopSchema.parse(req.body);
    const shop = await shopsService.createShop(req.user!.id, dto);
    res.status(201).json({ message: "Магазин создан", shop });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка";
    if (msg === "SHOP_EXISTS")
      return res.status(409).json({ message: "У вас уже есть магазин" });
    res.status(400).json({ message: msg });
  }
};

export const getAllShops = async (req: AuthRequest, res: Response) => {
  try {
    const query = ShopsListQuerySchema.parse(req.query);
    const result = await shopsService.getAllShops(query);
    res.json(result);
  } catch (err: unknown) {
    res
      .status(400)
      .json({ message: err instanceof Error ? err.message : "Ошибка" });
  }
};

export const getMyShop = async (req: AuthRequest, res: Response) => {
  try {
    const shop = await shopsService.getMyShop(req.user!.id);
    res.json({ shop });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка";
    if (msg === "SHOP_NOT_FOUND")
      return res.status(404).json({ message: "Магазин не найден" });
    res.status(400).json({ message: msg });
  }
};

export const getShopById = async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.id as string, 10);
    if (isNaN(shopId))
      return res.status(400).json({ message: "Неверный ID магазина" });

    const query = ShopProductsQuerySchema.parse(req.query);
    const result = await shopsService.getShopById(shopId, query);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка";
    if (msg === "SHOP_NOT_FOUND")
      return res.status(404).json({ message: "Магазин не найден" });
    res.status(400).json({ message: msg });
  }
};

export const updateShop = async (req: AuthRequest, res: Response) => {
  try {
    const dto = UpdateShopSchema.parse(req.body);
    const shop = await shopsService.updateShop(req.user!.id, dto);
    res.json({ message: "Магазин обновлён", shop });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка";
    if (msg === "SHOP_NOT_FOUND")
      return res.status(404).json({ message: "Магазин не найден" });
    res.status(400).json({ message: msg });
  }
};

export const deactivateShop = async (req: AuthRequest, res: Response) => {
  try {
    const result = await shopsService.deactivateShop(req.user!.id);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка";
    if (msg === "SHOP_NOT_FOUND")
      return res.status(404).json({ message: "Магазин не найден" });
    if (msg === "SHOP_ALREADY_INACTIVE")
      return res.status(400).json({ message: "Магазин уже деактивирован" });
    res.status(400).json({ message: msg });
  }
};

export const reactivateShop = async (req: AuthRequest, res: Response) => {
  try {
    const result = await shopsService.reactivateShop(req.user!.id);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка";
    if (msg === "SHOP_NOT_FOUND")
      return res.status(404).json({ message: "Магазин не найден" });
    if (msg === "SHOP_ALREADY_ACTIVE")
      return res.status(400).json({ message: "Магазин уже активен" });
    res.status(400).json({ message: msg });
  }
};
