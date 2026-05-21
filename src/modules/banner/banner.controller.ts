import { Request, Response } from "express";
import { bannerService } from "./banner.service";

const getActiveBanners = async (req: Request, res: Response) => {
  try {
    const banners = await bannerService.getActive();
    res.status(200).json({ banners });
  } catch (error) {
    console.error("Ошибка при получении баннеров:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

const createBanner = async (req: Request, res: Response) => {
  try {
    const storeId = Number(req.params.storeId);
    const banner = await bannerService.create(storeId, req.body);
    res.status(201).json({ banner });
  } catch (error: any) {
    console.error("Ошибка при создании баннера:", error);

    if (error.message.includes("уже есть активный баннер")) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "PROMO_INVALID") {
      return res
        .status(400)
        .json({ message: "Промокод недействителен или истёк" });
    }
    if (error.message === "PROMO_EXHAUSTED") {
      return res.status(400).json({ message: "Промокод больше недоступен" });
    }
    if (error.message === "PROMO_STORE_ALREADY_USED") {
      return res
        .status(400)
        .json({ message: "Ваш магазин уже использовал этот промокод" });
    }

    res.status(500).json({ message: "Ошибка сервера при создании баннера" });
  }
};
const approveBanner = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const banner = await bannerService.approve(id);
    res.status(200).json({ banner });
  } catch (error) {
    console.error("Ошибка при одобрении баннера:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

const rejectBanner = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    // Берем причину из тела запроса
    const { reason } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json({ message: "Необходимо указать причину отклонения" });
    }

    const banner = await bannerService.reject(id, reason);
    res.status(200).json({ banner });
  } catch (error) {
    console.error("Ошибка при отклонении баннера:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { getActiveBanners, createBanner, approveBanner, rejectBanner };
