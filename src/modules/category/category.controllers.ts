import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { parent: true, children: true },
      orderBy: { name: "asc" },
    });
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Ошибка при получении категорий:", error);
    res.status(500).json({ message: "Ошибка сервера при получении категорий" });
  } finally {
    await prisma.$disconnect();
  }
};
export { getCategories };
