import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { promoCodeService } from "./promo-code.service";
import { CreatePromoCodeDto } from "./promo-code.validation";

function requireAdmin(req: AuthRequest, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ message: "Не авторизован" });
    return false;
  }
  if (req.user.role !== "ADMIN") {
    res.status(403).json({ message: "Недостаточно прав" });
    return false;
  }
  return true;
}

function requireOwner(req: AuthRequest, res: Response): boolean {
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

export const createPromoCode = async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  try {
    const dto = CreatePromoCodeDto.parse(req.body);
    const promoCode = await promoCodeService.create(dto);
    return res.status(201).json({ promoCode });
  } catch (err: any) {
    console.error("Create promo code error:", err);
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ message: err.errors[0]?.message ?? "Ошибка валидации" });
    }
    if (err.message === "PROMO_CODE_EXISTS") {
      return res
        .status(409)
        .json({ message: "Промокод с таким кодом уже существует" });
    }
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const getAllPromoCodes = async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  try {
    const promoCodes = await promoCodeService.findAll();
    return res.status(200).json({ promoCodes });
  } catch (err) {
    console.error("Get promo codes error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const deactivatePromoCode = async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Неверный ID промокода" });
    }
    const promoCode = await promoCodeService.deactivate(id);
    return res.status(200).json({ promoCode });
  } catch (err: any) {
    console.error("Deactivate promo code error:", err);
    if (err.message === "PROMO_NOT_FOUND") {
      return res.status(404).json({ message: "Промокод не найден" });
    }
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const validatePromoCode = async (req: AuthRequest, res: Response) => {
  if (!requireOwner(req, res)) return;

  try {
    const code = typeof req.params.code === "string" ? req.params.code : "";
    if (!code) {
      return res.status(400).json({ message: "Код промокода обязателен" });
    }
    const result = await promoCodeService.validate(code, req.user!.id);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Validate promo code error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};
