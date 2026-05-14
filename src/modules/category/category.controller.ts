import { Request, Response } from "express";
import { CategoryService } from "./category.service";

function getIdFromParams(req: Request): number {
  const id = req.params.id;
  const parsed = parseInt(Array.isArray(id) ? id[0] : id, 10);
  if (isNaN(parsed)) throw new Error("Некорректный id");
  return parsed;
}

// ! categories
const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await CategoryService.getCategories();
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Ошибка при получении категорий:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ! categories tree
const getCategoriesTree = async (req: Request, res: Response) => {
  try {
    const categories = await CategoryService.getCategoriesTree();
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Ошибка при получении дерева категорий:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ! Create category
const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(400)
        .json({ message: "Название категории обязательно" });
    }

    const parsedParentId = parentId ? Number(parentId) : null;

    const category = await CategoryService.createCategory(name, parsedParentId);

    res.status(201).json({ message: "Категория успешно создана", category });
  } catch (error: any) {
    console.error(error);
    const status = error.message.includes("уже существует") ? 409 : 400;
    res.status(status).json({ message: error.message });
  }
};

// ! Update category
const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = getIdFromParams(req);
    const { name, parentId } = req.body;

    const category = await CategoryService.updateCategory(id, name, parentId);

    res.status(200).json({ message: "Категория успешно обновлена", category });
  } catch (error: any) {
    console.error(error);
    const status = error.message.includes("не найдена") ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

// ! Delete category
const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = getIdFromParams(req);
    await CategoryService.deleteCategory(id);

    res.status(200).json({ message: "Категория успешно удалена" });
  } catch (error: any) {
    console.error(error);
    const status = error.message.includes("не найдена") ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

export {
  getCategories,
  getCategoriesTree,
  createCategory,
  updateCategory,
  deleteCategory,
};
