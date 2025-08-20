import { Router } from "express";
import { PrismaClient, UserRole } from "@prisma/client";
import { authMiddleware } from "../auth/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// Назначение роли пользователю (только для админа)
router.post(
  "/set-role/:userId",
  authMiddleware(["ADMIN"]),
  async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body; // роль, которую хотим назначить: "USER", "OWNER", "ADMIN"

    if (!["USER", "OWNER", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Неверная роль" });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: Number(userId) },
        data: { role: role as UserRole }, // приводим к типу UserRole
      });

      res.json({
        message: `Роль пользователя обновлена на ${role}`,
        user: updatedUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

export default router;
