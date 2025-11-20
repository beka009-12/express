import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
const prisma = new PrismaClient();

const createBrand = async (req: Request, res: Response) => {
  try {
    const { name, logoUrl } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Название бренда обязательно!" });
    }

    const brand = await prisma.brand.create({ data: { name, logoUrl } });

    return res.status(201).json({ message: "Бренд создан", brand });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ошибка при создании", error: error.message });
  }
};

const getBrands = async (req: Request, res: Response) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(brands);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Ошибка при получении брендов", error: error.message });
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
      where: { id: brandId },
      include: { products: true },
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
const updateBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, logoUrl } = req.body;
    const updated = await prisma.brand.update({
      where: { id: Number(id) },
      data: { name, logoUrl },
    });
    return res.json({ message: "Бренд обновлён", brand: updated });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Ошибка при обновлении бренда", error: error.message });
  }
};

const deleteBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.brand.delete({ where: { id: Number(id) } });
    return res.json({ message: "Бренд удалён" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Ошибка при удалении бренда", error: error.message });
  }
};

export { createBrand, deleteBrand, getBrandById, getBrands, updateBrand };
