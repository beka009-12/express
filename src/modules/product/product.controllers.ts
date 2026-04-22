import { Request, Response } from "express";
import { supabase } from "../../plugin/supabase";
import { prisma } from "../../prisma";
import { Prisma } from "@prisma/client";
import { generateUniqueSKU } from "../../utils/skuGenerator";

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

// ✅ CREATE PRODUCT
const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const {
      categoryId,
      brandName,
      title,
      description,
      price,
      newPrice,
      stockCount,
      sizes,
      colors,
      gender,
      season,
    } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    if (
      !categoryId ||
      !title ||
      !description ||
      !price ||
      !sizes ||
      !colors ||
      !gender ||
      !season
    ) {
      return res.status(400).json({ message: "Заполните обязательные поля" });
    }

    // Валидация массивов
    if (!Array.isArray(sizes) || sizes.length === 0) {
      return res
        .status(400)
        .json({ message: "sizes должен быть непустым массивом" });
    }

    if (!Array.isArray(colors) || colors.length === 0) {
      return res
        .status(400)
        .json({ message: "colors должен быть непустым массивом" });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Добавьте хотя бы одно фото" });
    }

    // Проверка цены со скидкой
    if (newPrice && Number(newPrice) >= Number(price)) {
      return res.status(400).json({
        message:
          "Цена со скидкой (newPrice) должна быть меньше основной цены (price)",
      });
    }

    const seasonOptions = ["SPRING_SUMMER", "AUTUMN_WINTER", "ALL_SEASON"];

    if (season && !seasonOptions.includes(season)) {
      return res.status(400).json({
        message:
          "Неверно указан сезон. Ожидается одно из: SPRING_SUMMER, AUTUMN_WINTER, ALL_SEASON",
      });
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!store) {
      return res.status(400).json({ message: "Сначала создайте магазин" });
    }

    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
    });

    if (!category) {
      return res.status(400).json({ message: "Категория не найдена" });
    }

    // Загрузка изображений (без изменений)
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      const { data, error } = await supabase.storage
        .from("product-image")
        .upload(`uploads/${fileName}`, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) throw new Error(`Ошибка загрузки: ${error.message}`);

      const { data: publicUrl } = supabase.storage
        .from("product-image")
        .getPublicUrl(data.path);

      uploadedUrls.push(publicUrl.publicUrl);
    }

    const sku = await generateUniqueSKU(
      prisma,
      brandName,
      title,
      colors,
      category.name,
    );

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: Number(categoryId),
        brandName: brandName || null,
        title: title.trim(),
        description: description.trim(),
        images: uploadedUrls,
        price: Number(price),
        newPrice: newPrice ? Number(newPrice) : null,
        stockCount: stockCount ? Number(stockCount) : 0,
        isActive: true,
        sku: sku,

        sizes: sizes,
        colors: colors,

        gender: gender.trim(),
        season: season.trim(),
      },
      include: { category: true, store: true },
    });

    res.status(201).json({ message: "Товар создан", product });
  } catch (e) {
    res.status(500).json({
      message: "Ошибка создания товара",
      error: e instanceof Error ? e.message : "Ошибка",
    });
  }
};

// ✅ GET PRODUCTS (seller only)
const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id)
      return res.status(401).json({ message: "Не авторизован" });

    const store = await prisma.store.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!store) return res.status(404).json({ message: "Магазин не найден" });

    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ products });
  } catch (error) {
    console.error("Ошибка получения товаров:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ✅ GET PRODUCT BY ID
const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            isVerified: true,
            rating: true,
          },
        },
        category: true,
      },
    });

    if (!product) return res.status(404).json({ message: "Товар не найден" });

    return res.status(200).json({ product });
  } catch (error) {
    console.error("Ошибка получения товара:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ✅ DELETE PRODUCT
const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user?.id) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { store: true },
    });

    if (!product) return res.status(404).json({ message: "Товар не найден" });

    if (product.store.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Нет доступа для удаления" });
    }

    if (product.images.length > 0) {
      for (const imageUrl of product.images) {
        try {
          const path = imageUrl.split("/").slice(-2).join("/");
          await supabase.storage.from("product-image").remove([path]);
        } catch (err) {
          console.error("Ошибка удаления изображения:", err);
        }
      }
    }

    await prisma.product.delete({ where: { id: Number(id) } });

    return res.status(200).json({ message: "Товар удалён" });
  } catch (error) {
    console.error("Ошибка удаления товара:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ✅ UPDATE PRODUCT
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

// ✅ GET ALL PRODUCTS FOR USERS (with filters)
const getAllProductsForUsers = async (req: Request, res: Response) => {
  const {
    page = "1",
    limit = "20",
    categoryId,
    brandName,
    minPrice,
    maxPrice,
    search,
    sort = "createdAt",
    order = "desc",
  } = req.query;

  try {
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));

    const andConditions: Prisma.ProductWhereInput[] = [
      { isActive: true },
      { archivedAt: null },
    ];

    if (categoryId) andConditions.push({ categoryId: Number(categoryId) });

    if (brandName) {
      andConditions.push({
        brandName: { contains: String(brandName), mode: "insensitive" },
      });
    }

    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : 99999999;

      andConditions.push({
        OR: [
          {
            AND: [
              { newPrice: { not: null } },
              { newPrice: { gte: min, lte: max } },
            ],
          },
          { AND: [{ newPrice: null }, { price: { gte: min, lte: max } }] },
        ],
      });
    }

    if (search) {
      const searchStr = String(search);
      andConditions.push({
        OR: [
          { title: { contains: searchStr, mode: "insensitive" } },
          { brandName: { contains: searchStr, mode: "insensitive" } },
        ],
      });
    }

    const where: any = { AND: andConditions };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { [String(sort)]: order },
        include: { category: true, store: true },
      }),
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ✅ GET PRODUCTS BY CATEGORY (including subcategories)
const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { page = "1", limit = "20" } = req.query;

    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
      include: {
        children: {
          include: { children: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    const getAllCategoryIds = (cat: any): number[] => {
      const ids = [cat.id];
      if (cat.children) {
        cat.children.forEach((child: any) => {
          ids.push(...getAllCategoryIds(child));
        });
      }
      return ids;
    };

    const categoryIds = getAllCategoryIds(category);

    const products = await prisma.product.findMany({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
        archivedAt: null,
      },
      skip: (+page - 1) * +limit,
      take: +limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            isVerified: true,
          },
        },
      },
    });

    const total = await prisma.product.count({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
        archivedAt: null,
      },
    });

    res.json({
      products,
      category,
      pagination: {
        total,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(total / +limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения товаров категории:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

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
  getProduct,
  getProductById,
  deleteProduct,
  updateProduct,
  getAllProductsForUsers,
  getProductsByCategory,
  getSimilarProducts,
};
