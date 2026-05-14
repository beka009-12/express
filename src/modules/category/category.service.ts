import { prisma } from "../../prisma";
import { CategoryWithChildren } from "./category.types";

class categoryService {
  // ? ✅ GET CATEGORIES
  async getCategories() {
    const categories = await prisma.category.findMany({
      include: { parent: true, children: true },
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

    return categoriesWithCount;
  }

  // ? ✅ GET CATEGORIES TREE
  async getCategoriesTree(): Promise<CategoryWithChildren[]> {
    const allCategories = await prisma.category.findMany({
      include: {
        parent: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    const categoryMap = new Map<number, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // Первый проход: создаём все категории с пустым массивом children
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
      } as CategoryWithChildren);
    });

    // Второй проход: строим дерево
    allCategories.forEach((cat) => {
      const currentCategory = categoryMap.get(cat.id)!;

      if (cat.parentId === null) {
        rootCategories.push(currentCategory);
      } else {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(currentCategory);
        }
      }
    });

    return rootCategories;
  }

  // ? ✅ CREATE CATEGORY
  async createCategory(name: string, parentId: number | null) {
    const trimmedName = name.trim();

    const existing = await prisma.category.findFirst({
      where: {
        name: trimmedName,
        parentId: parentId,
      },
    });

    if (existing) {
      throw new Error(
        "Категория с таким именем уже существует на данном уровне",
      );
    }

    if (parentId !== null) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentExists) {
        throw new Error("Родительская категория не найдена");
      }
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        parentId: parentId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return category;
  }

  // ? ✅ UPDATE CATEGORY
  async updateCategory(id: number, name?: string, parentId?: number | null) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new Error("Категория не найдена");

    if (parentId === id)
      throw new Error("Категория не может быть родителем самой себе");

    let newParentId = parentId !== undefined ? parentId : existing.parentId;

    if (newParentId !== null && newParentId !== undefined) {
      const isDescendant = await this.checkIfDescendant(id, newParentId);
      if (isDescendant)
        throw new Error("Нельзя создать циклическую зависимость");
    }

    return prisma.category.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        parentId: newParentId,
      },
      include: { parent: true, children: true },
    });
  }

  // ? ✅ DELETE CATEGORY
  async deleteCategory(id: number) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!category) throw new Error("Категория не найдена");

    if (category.children.length > 0) {
      throw new Error("Нельзя удалить категорию с подкатегориями");
    }

    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new Error(
        `Нельзя удалить категорию с товарами (${productsCount} шт)`,
      );
    }

    await prisma.category.delete({ where: { id } });
    return { message: "Категория успешно удалена" };
  }

  // ? ✅ CHECK IF DESCENDANT
  async checkIfDescendant(
    categoryId: number,
    potentialParentId: number,
  ): Promise<boolean> {
    if (categoryId === potentialParentId) return true;

    const parent = await prisma.category.findUnique({
      where: { id: potentialParentId },
      select: { parentId: true },
    });

    if (!parent || parent.parentId === null) return false;

    return this.checkIfDescendant(categoryId, parent.parentId);
  }
}

export const CategoryService = new categoryService();
