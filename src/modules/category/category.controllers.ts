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

    // Добавляем количество товаров отдельно
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

// Получить дерево категорий (иерархическая структура)
const getCategoriesTree = async (req: Request, res: Response) => {
  try {
    // Получаем все категории
    const allCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Строим дерево вручную
    const categoryMap = new Map<number, any>();
    const rootCategories: any[] = [];

    // Создаем мапу всех категорий
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Строим дерево
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

    // Валидация
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ message: "Название категории обязательно" });
    }

    // Если есть parentId, проверяем существует ли родительская категория
    if (parentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentExists) {
        return res
          .status(404)
          .json({ message: "Родительская категория не найдена" });
      }
    }

    // Проверяем уникальность (name + parentId)
    const existingCategory = await prisma.category.findUnique({
      where: {
        name_parentId: {
          name: name.trim(),
          parentId: parentId || null,
        },
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Категория с таким именем уже существует на этом уровне",
      });
    }

    // Создаем категорию
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
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
    const { id } = req.params;
    const { name, parentId } = req.body;

    // Проверяем существование категории
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    // Проверяем, чтобы категория не стала сама себе родителем
    if (parentId && parseInt(id) === parentId) {
      return res.status(400).json({
        message: "Категория не может быть родителем сама себе",
      });
    }

    // Проверяем циклические зависимости
    if (parentId) {
      const isDescendant = await checkIfDescendant(parseInt(id), parentId);
      if (isDescendant) {
        return res.status(400).json({
          message: "Нельзя сделать дочернюю категорию родителем",
        });
      }
    }

    // Обновляем категорию
    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name?.trim() || existingCategory.name,
        parentId: parentId !== undefined ? parentId : existingCategory.parentId,
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
    const { id } = req.params;

    // Проверяем существование категории
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        children: true,
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    // Проверяем, есть ли дочерние категории
    if (category.children.length > 0) {
      return res.status(400).json({
        message:
          "Нельзя удалить категорию с подкатегориями. Сначала удалите или переместите их.",
      });
    }

    // Проверяем, есть ли товары в этой категории
    const productsCount = await prisma.product.count({
      where: { categoryId: parseInt(id) },
    });

    if (productsCount > 0) {
      return res.status(400).json({
        message: `Нельзя удалить категорию с товарами (${productsCount} шт). Сначала переместите товары.`,
      });
    }

    // Удаляем категорию
    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      message: "Категория успешно удалена",
    });
  } catch (error) {
    console.error("Ошибка при удалении категории:", error);
    res.status(500).json({ message: "Ошибка сервера при удалении категории" });
  }
};

// Вспомогательная функция для проверки циклических зависимостей
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
