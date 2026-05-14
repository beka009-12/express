import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { UserService } from "./user.service";

const getProfileController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });

    const user = await UserService.getProfile(userId);

    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Ошибка получения профиля:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const updateProfileController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });

    const updatedUser = await UserService.updateProfile(userId, req.body);

    return res.status(200).json({ user: updatedUser });
  } catch (error: any) {
    console.error("Ошибка обновления профиля:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ message: "Email уже используется" });
    }

    return res.status(500).json({ message: "Ошибка при обновлении профиля" });
  }
};

export { getProfileController, updateProfileController };
