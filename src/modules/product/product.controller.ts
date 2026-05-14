import { Request, Response } from "express";
import { supabase } from "../../plugin/supabase";
import { prisma } from "../../prisma";
import { Prisma } from "@prisma/client";
import { CreateProductDto } from "./product.validation";
import { productService } from "./product.service";

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

// ? ✅ CREATE PRODUCT
const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Добавьте хотя бы одно фото" });
    }

    const dto: CreateProductDto = {
      categoryId: Number(req.body.categoryId),
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      newPrice: req.body.newPrice ? Number(req.body.newPrice) : null,
      stockCount: req.body.stockCount ? Number(req.body.stockCount) : 0,
      brandName: req.body.brandName || null,
      sizes:
        typeof req.body.sizes === "string"
          ? JSON.parse(req.body.sizes)
          : req.body.sizes,
      colors:
        typeof req.body.colors === "string"
          ? JSON.parse(req.body.colors)
          : req.body.colors,
      material: req.body.material || null,
      gender: req.body.gender,
      season: req.body.season,
    };

    // Загрузка изображений
    const imageData: Array<{
      url: string;
      isMain?: boolean;
      altText?: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;

      const { data, error } = await supabase.storage
        .from("product-image")
        .upload(`uploads/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) throw new Error(`Ошибка загрузки: ${error.message}`);

      const { data: publicUrl } = supabase.storage
        .from("product-image")
        .getPublicUrl(data.path);

      imageData.push({
        url: publicUrl.publicUrl,
        isMain: i === 0, // первое фото — главное
        altText: `${dto.title} - фото ${i + 1}`,
      });
    }

    const product = await productService.createProdct(
      req.user!.id,
      dto,
      imageData,
    );

    return res.status(201).json({
      message: "Товар успешно создан",
      product,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(400).json({
      message: e.message || "Ошибка при создании товара",
    });
  }
};

// ? ✅ GET PRODUCT BY ID (Public - для всех пользователей)
const getProductByIdPublic = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.id);

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Неверный ID товара" });
    }

    const product = await productService.getProductByIdPublic(productId);

    if (!product) {
      return res
        .status(404)
        .json({ message: "Товар не найден или не доступен" });
    }

    return res.status(200).json({ product });
  } catch (error: any) {
    console.error("Ошибка получения товара (public):", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ? ✅ GET PRODUCT BY ID (для владельца магазина)
const getProductByIdOwner = async (req: AuthRequest, res: Response) => {
  try {
    const productId = Number(req.params.id);

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Неверный ID товара" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    const product = await productService.getProductById(productId, req.user.id);

    if (!product) {
      return res
        .status(404)
        .json({ message: "Товар не найден или у вас нет доступа" });
    }

    return res.status(200).json({ product });
  } catch (error: any) {
    console.error("Ошибка получения товара (owner):", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ? ✅ DELETE PRODUCT
const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const productId = Number(req.params.id);

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Неверный ID товара" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    const result = await productService.deleteProduct(productId, req.user.id);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Delete product error:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("нет прав")) {
      return res.status(403).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка при удалении товара" });
  }
};

// ? ✅ UPDATE PRODUCT
const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      newPrice,
      stockCount,
      categoryId,
      size,
      color,
      gender,
      season,
      brandName,
    } = req.body;

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });

    // Ищем товар и проверяем владельца
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { store: true },
    });

    if (!product) return res.status(404).json({ message: "Товар не найден" });
    if (product.store.ownerId !== userId)
      return res.status(403).json({ message: "Нет доступа" });

    // Валидация цен (с проверкой на NaN)
    const parsedPrice =
      price !== undefined ? Number(price) : Number(product.price);
    let parsedNewPrice = product.newPrice ? Number(product.newPrice) : null;

    if (newPrice !== undefined) {
      parsedNewPrice =
        newPrice === null || newPrice === "" ? null : Number(newPrice);
    }

    if (parsedNewPrice !== null && parsedNewPrice >= parsedPrice) {
      return res
        .status(400)
        .json({ message: "Цена со скидкой должна быть меньше основной" });
    }

    // Логика наличия
    const currentStockCount =
      stockCount !== undefined ? Number(stockCount) : product.stockCount;

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price !== undefined && { price: parsedPrice }),
        newPrice: parsedNewPrice, // Обновляем (может быть null)
        stockCount: currentStockCount,
        ...(categoryId && { categoryId: Number(categoryId) }),
        brandName:
          brandName !== undefined ? brandName || null : product.brandName,
        ...(size && { size: size.trim() }),
        ...(color && { color: color.trim() }),
        ...(gender && { gender: gender.trim() }),
        ...(season && { season: season.trim() }),
        // Автоматические статусы
        archivedAt: currentStockCount === 0 ? new Date() : null,
        isActive: currentStockCount > 0,
      },
    });

    res.json({ message: "Товар обновлён", product: updated });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Ошибка обновления" });
  }
};

// ? ✅ GET ALL PRODUCTS / GET PRODUCTS INFINITE (with filters)
const getProductsInfinite = async (req: Request, res: Response) => {
  try {
    const result = await productService.getProductsInfinite({
      cursor: req.query.cursor ? Number(req.query.cursor) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search as string | undefined,
      categoryId: req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      gender: req.query.gender as string | undefined,
      season: req.query.season as string | undefined,
      brandName: req.query.brandName as string | undefined,
      sort: req.query.sort as string | undefined,
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ? GET PRODUCTS BY CATEGORY
const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = Number(req.params.categoryId);
    const { page = "1", limit = "20", minPrice, maxPrice, sort } = req.query;

    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({ message: "Неверный ID категории" });
    }

    const result = await productService.getProductsByCategory(categoryId, {
      page: Number(page),
      limit: Number(limit),
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sort as string | undefined,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Get products by category error:", error);

    if (error.message === "Категория не найдена") {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ? ✅ GET SIMILAR PRODUCTS
const getSimilarProducts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Не указан id товара" });
    }

    const currentProduct = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!currentProduct) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    const similarProducts = await prisma.product.findMany({
      where: {
        categoryId: currentProduct.categoryId,
        id: { not: currentProduct.id },
      },
      take: 6,
    });

    return res.status(200).json(similarProducts);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ошибка сервера при получении похожих товаров" });
  }
};

export {
  createProduct,
  getProductByIdPublic,
  getProductByIdOwner,
  deleteProduct,
  updateProduct,
  getProductsInfinite,
  getProductsByCategory,
  getSimilarProducts,
};
