"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBrand = exports.getBrands = exports.getBrandById = exports.deleteBrand = exports.createBrand = void 0;
const prisma_1 = require("../../prisma");
const createBrand = async (req, res) => {
    try {
        const { name, logoUrl } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Название бренда обязательно!" });
        }
        const brand = await prisma_1.prisma.brand.create({ data: { name, logoUrl } });
        return res.status(201).json({ message: "Бренд создан", brand });
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Ошибка при создании", error: error.message });
    }
};
exports.createBrand = createBrand;
const getBrands = async (req, res) => {
    try {
        const brands = await prisma_1.prisma.brand.findMany({
            orderBy: { createdAt: "desc" },
        });
        return res.json(brands);
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: "Ошибка при получении брендов", error: error.message });
    }
};
exports.getBrands = getBrands;
const getBrandById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "ID бренда не указан" });
        }
        const brandId = Number(id);
        if (!brandId) {
            return res.status(400).json({ message: "Некорректный ID бренда" });
        }
        const brand = await prisma_1.prisma.brand.findUnique({
            where: { id: brandId },
            include: { products: true },
        });
        if (!brand) {
            return res.status(404).json({ message: "Бренд не найден" });
        }
        return res.json(brand);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Ошибка при поиске бренда" });
    }
};
exports.getBrandById = getBrandById;
const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, logoUrl } = req.body;
        const updated = await prisma_1.prisma.brand.update({
            where: { id: Number(id) },
            data: { name, logoUrl },
        });
        return res.json({ message: "Бренд обновлён", brand: updated });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: "Ошибка при обновлении бренда", error: error.message });
    }
};
exports.updateBrand = updateBrand;
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.brand.delete({ where: { id: Number(id) } });
        return res.json({ message: "Бренд удалён" });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: "Ошибка при удалении бренда", error: error.message });
    }
};
exports.deleteBrand = deleteBrand;
