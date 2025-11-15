import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

const getCategory = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    const parentCategories = categories.filter((cate) => !cate.parentId);

    return res.status(200).json({ categories: parentCategories });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера при получении категорий" });
  }
};

const createCategory = (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;

    if (!name)
      return res
        .status(400)
        .json({ message: "Название категории обязательно" });
  } catch (error) {
    return res.status(500).json({
      message: "Ошибка при создании категории",
      error: error,
    });
  }
};

export { getCategory };
