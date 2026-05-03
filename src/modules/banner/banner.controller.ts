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
    // В будущем storeId лучше брать из req.user.storeId (из токена)
    const storeId = Number(req.params.storeId);

    const banner = await bannerService.create(storeId, req.body);
    res.status(201).json({ banner });
  } catch (error: any) {
    console.error("Ошибка при создании баннера:", error);

    // Если это наша кастомная ошибка (например, "баннер уже существует")
    if (error.message.includes("уже есть активный баннер")) {
      return res.status(400).json({ message: error.message });
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
