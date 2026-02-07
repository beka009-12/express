import { Request, Response } from "express";
import { prisma } from "../../prisma";

function getIdFromParams(req: Request): number | null {
  const { id } = req.params;
  if (!id) return null;

  const idStr = Array.isArray(id) ? id[0] : id;

  const parsed = parseInt(idStr, 10);
  return isNaN(parsed) ? null : parsed;
}

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
      const category = categoryMap.get(cat.id)!;
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

const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(400)
        .json({ message: "Название категории обязательно" });
    }

    let parsedParentId: number | null = null;
    if (parentId !== undefined && parentId !== null) {
      parsedParentId = Number(parentId);
      if (isNaN(parsedParentId)) {
        return res.status(400).json({ message: "Некорректный parentId" });
      }

      const parentExists = await prisma.category.findUnique({
        where: { id: parsedParentId },
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
          parentId: parsedParentId! ?? null,
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
        parentId: parsedParentId! ?? null,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    res.status(201).json({ message: "Категория успешно создана", category });
  } catch (error) {
    console.error("Ошибка при создании категории:", error);
    res.status(500).json({ message: "Ошибка сервера при создании категории" });
  }
};

const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = getIdFromParams(req);
    if (id === null) {
      return res
        .status(400)
        .json({ message: "Некорректный или отсутствующий id" });
    }

    const { name, parentId } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    if (parentId !== undefined && parentId === id) {
      return res.status(400).json({
        message: "Категория не может быть родителем сама себе",
      });
    }

    let newParentId: number | null = existingCategory.parentId;
    if (parentId !== undefined) {
      if (parentId === null) {
        newParentId = null;
      } else {
        const parsed = Number(parentId);
        if (isNaN(parsed)) {
          return res.status(400).json({ message: "Некорректный parentId" });
        }
        newParentId = parsed;

        const isDescendant = await checkIfDescendant(id, newParentId);
        if (isDescendant) {
          return res.status(400).json({
            message:
              "Нельзя сделать дочернюю категорию родителем (циклическая зависимость)",
          });
        }
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name:
          name && typeof name === "string"
            ? name.trim()
            : existingCategory.name,
        parentId: newParentId! ?? null,
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

const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = getIdFromParams(req);
    if (id === null) {
      return res
        .status(400)
        .json({ message: "Некорректный или отсутствующий id" });
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
        message:
          "Нельзя удалить категорию с подкатегориями. Сначала удалите или переместите их.",
      });
    }

    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return res.status(400).json({
        message: `Нельзя удалить категорию с товарами (${productsCount} шт). Сначала переместите товары.`,
      });
    }

    await prisma.category.delete({ where: { id } });

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
  if (categoryId === potentialParentId) return true;

  const parent = await prisma.category.findUnique({
    where: { id: potentialParentId },
    select: { parentId: true },
  });

  if (!parent || parent.parentId === null) return false;

  return checkIfDescendant(categoryId, parent.parentId);
}

export {
  getCategories,
  getCategoriesTree,
  createCategory,
  updateCategory,
  deleteCategory,
};
