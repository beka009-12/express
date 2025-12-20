"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = void 0;
const prisma_1 = require("../../prisma");
const getCategories = async (req, res) => {
    try {
        const categories = await prisma_1.prisma.category.findMany({
            include: { parent: true, children: true },
            orderBy: { name: "asc" },
        });
        res.status(200).json({ categories });
    }
    catch (error) {
        console.error("Ошибка при получении категорий:", error);
        res.status(500).json({ message: "Ошибка сервера при получении категорий" });
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
};
exports.getCategories = getCategories;
