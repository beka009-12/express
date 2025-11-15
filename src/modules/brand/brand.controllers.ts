import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

const createBrands = async (req: Request, res: Response) => {
  try {
    const { name, logoUrl } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Название бренда обязательно" });
    }

    const brand = await prisma.brand.create({
      data: { name: name, logoUrl },
    });

    return res.status(201).json({ message: "Бренд создан", brand });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ошибка при создании бренда", error: error.message });
  }
};

const getBrands = async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : undefined;

    const brands = await prisma.brand.findMany({
      where: categoryId
        ? {
            products: {
              some: { categoryId },
            },
          }
        : {},
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(brands);
  } catch (error) {
    return res.status(502).json({ massage: "ошибка при получение бренда" });
  }
};

const updateBrand = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, logoUrl } = req.body;

    const update = await prisma.brand.update({
      where: { id },
      data: { name, logoUrl },
    });
    return res.status(200).json(update);
  } catch (error) {
    return res.status(502).json({ massage: "ошибка при изменении бренда" });
  }
};

const deleteBrand = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.brand.delete({ where: { id } });
    return res.status(200).json({ message: "удалено успешно" });
  } catch (error) {
    return res.status(502).json({ massage: "ошибка при удалении бренда" });
  }
};

const getBrandById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID бренда не указан" });
    }

    const brandId = Number(id);
    if (!brandId) {
      return res.status(400).json({ message: "Некорректный ID бренда" });
    }

    const brand = await prisma.brand.findUnique({
      where: {
        id: brandId,
      },
      include: {
        products: true,
      },
    });

    if (!brand) {
      return res.status(404).json({ message: "Бренд не найден" });
    }

    return res.json(brand);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка при поиске бренда" });
  }
};

export { getBrands, createBrands, deleteBrand, updateBrand, getBrandById };
