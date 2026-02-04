import { Request, Response } from "express";
import { prisma } from "../../prisma";

// Получить все категории (плоский список)
const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
      },
      orderBy: { name: "asc" },
    });

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        _count: {
          products: await prisma.product.count({
            where: { categoryId: cat.id },
          }),
        },
      })),
    );

    res.status(200).json({ categories: categoriesWithCount });
  } catch (error) {
    console.error("Ошибка при получении категорий:", error);
    res.status(500).json({ message: "Ошибка сервера при получении категорий" });
  }
};

// Получить дерево категорий
const getCategoriesTree = async (req: Request, res: Response) => {
  try {
    const allCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const categoryMap = new Map<number, any>();
    const rootCategories: any[] = [];

    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    allCategories.forEach((cat) => {
      const category = categoryMap.get(cat.id);
      if (cat.parentId === null) {
        rootCategories.push(category);
      } else {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(category);
        }
      }
    });

    res.status(200).json({ categories: rootCategories });
  } catch (error) {
    console.error("Ошибка при получении дерева категорий:", error);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении дерева категорий" });
  }
};

// Создать категорию
const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;
    const pId = parentId ? Number(parentId) : null;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(400)
        .json({ message: "Название категории обязательно" });
    }

    if (pId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: pId },
      });

      if (!parentExists) {
        return res
          .status(404)
          .json({ message: "Родительская категория не найдена" });
      }
    }

    const existingCategory = await prisma.category.findUnique({
      where: {
        name_parentId: {
          name: name.trim(),
          parentId: pId!,
        },
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Категория с таким именем уже существует на этом уровне",
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        parentId: pId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    res.status(201).json({
      message: "Категория успешно создана",
      category,
    });
  } catch (error) {
    console.error("Ошибка при создании категории:", error);
    res.status(500).json({ message: "Ошибка сервера при создании категории" });
  }
};

// Обновить категорию
const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, parentId } = req.body;
    const pId =
      parentId !== undefined
        ? parentId === null
          ? null
          : Number(parentId)
        : undefined;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Некорректный ID категории" });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    if (pId !== undefined && pId !== null) {
      if (id === pId) {
        return res
          .status(400)
          .json({ message: "Категория не может быть родителем сама себе" });
      }

      const isDescendant = await checkIfDescendant(id, pId);
      if (isDescendant) {
        return res
          .status(400)
          .json({ message: "Нельзя сделать дочернюю категорию родителем" });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: typeof name === "string" ? name.trim() : existingCategory.name,
        parentId: pId !== undefined ? pId : existingCategory.parentId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    res.status(200).json({
      message: "Категория успешно обновлена",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Ошибка при обновлении категории:", error);
    res
      .status(500)
      .json({ message: "Ошибка сервера при обновлении категории" });
  }
};

// Удалить категорию
const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Некорректный ID категории" });
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!category) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    if (category.children.length > 0) {
      return res.status(400).json({
        message: "Нельзя удалить категорию с подкатегориями.",
      });
    }

    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return res.status(400).json({
        message: `Нельзя удалить категорию с товарами (${productsCount} шт).`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.status(200).json({ message: "Категория успешно удалена" });
  } catch (error) {
    console.error("Ошибка при удалении категории:", error);
    res.status(500).json({ message: "Ошибка сервера при удалении категории" });
  }
};

async function checkIfDescendant(
  categoryId: number,
  potentialParentId: number,
): Promise<boolean> {
  const potentialParent = await prisma.category.findUnique({
    where: { id: potentialParentId },
    include: { parent: true },
  });

  if (!potentialParent) return false;
  if (potentialParent.id === categoryId) return true;
  if (!potentialParent.parentId) return false;

  return checkIfDescendant(categoryId, potentialParent.parentId);
}

export {
  getCategories,
  getCategoriesTree,
  createCategory,
  updateCategory,
  deleteCategory,
};
