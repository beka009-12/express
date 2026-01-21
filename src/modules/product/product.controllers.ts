import { Request, Response } from "express";
import { supabase } from "../../plugin/supabase";
import { prisma } from "../../prisma";

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
      oldPrice,
      stockCount,
      tags,
    } = req.body;

    // Валидация
    if (!req.user?.id) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    if (!categoryId || !title || !description || !price) {
      return res.status(400).json({ message: "Заполните обязательные поля" });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Добавьте хотя бы одно фото" });
    }

    // Проверка магазина
    const store = await prisma.store.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!store) {
      return res.status(400).json({ message: "Сначала создайте магазин" });
    }

    // Проверка категории
    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
    });

    if (!category) {
      return res.status(400).json({ message: "Категория не найдена" });
    }

    // Загрузка изображений
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;

      const { data, error } = await supabase.storage
        .from("product-image")
        .upload(`uploads/${fileName}`, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Ошибка загрузки файла:", error);
        throw new Error(`Ошибка загрузки изображения: ${error.message}`);
      }

      const { data: publicUrl } = supabase.storage
        .from("product-image")
        .getPublicUrl(data.path);

      uploadedUrls.push(publicUrl.publicUrl);
    }

    // Парсинг тегов
    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        console.error("Ошибка парсинга тегов:", e);
        parsedTags = [];
      }
    }

    // Создание продукта
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: Number(categoryId),
        brandName: brandName || null,
        title: title.trim(),
        description: description.trim(),
        images: uploadedUrls,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        stockCount: stockCount ? Number(stockCount) : 0,
        tags: parsedTags,
        isActive: true,
      },
      include: {
        category: true,
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            isVerified: true,
            rating: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Товар успешно создан",
      product,
    });
  } catch (e) {
    console.error("Ошибка создания товара:", e);
    res.status(500).json({
      message: "Ошибка создания товара",
      error: e instanceof Error ? e.message : "Неизвестная ошибка",
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
      include: {
        category: true,
      },
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

    // Удаляем изображения из Supabase
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
      oldPrice,
      stockCount,
      tags,
      categoryId,
      brandName,
    } = req.body;

    if (!req.user?.id)
      return res.status(401).json({ message: "Не авторизован" });

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { store: true },
    });

    if (!product) return res.status(404).json({ message: "Товар не найден" });

    if (product.store.ownerId !== req.user.id)
      return res.status(403).json({ message: "Нет доступа" });

    // Обновляем продукт
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price: Number(price) }),
        ...(oldPrice !== undefined && {
          oldPrice: oldPrice ? Number(oldPrice) : null,
        }),
        ...(stockCount !== undefined && { stockCount: Number(stockCount) }),
        ...(tags && { tags: JSON.parse(tags) }),
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(brandName !== undefined && { brandName: brandName || null }),
        // Автоматически архивируем если товар закончился
        archivedAt: stockCount === 0 ? new Date() : null,
        isActive: stockCount > 0,
      },
      include: {
        category: true,
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    res.json({
      message: "Товар обновлён",
      product: updated,
    });
  } catch (error) {
    console.error("Ошибка обновления товара:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ✅ GET ALL PRODUCTS FOR USERS (with filters)
const getAllProductsForUsers = async (req: Request, res: Response) => {
  try {
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

    const filters: any = {
      isActive: true,
      archivedAt: null,
    };

    // Фильтр по категории
    if (categoryId) {
      filters.categoryId = Number(categoryId);
    }

    // Фильтр по бренду
    if (brandName) {
      filters.brandName = {
        contains: String(brandName),
        mode: "insensitive",
      };
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      filters.price = {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      };
    }

    // Поиск по названию и описанию
    if (search) {
      filters.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
        { tags: { has: String(search) } },
      ];
    }

    // Подсчет общего количества
    const total = await prisma.product.count({ where: filters });

    // Получение товаров
    const products = await prisma.product.findMany({
      where: filters,
      skip: (+page - 1) * +limit,
      take: +limit,
      orderBy: { [String(sort)]: order },
      include: {
        category: true,
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            isVerified: true,
            rating: true,
          },
        },
      },
    });

    res.json({
      products,
      pagination: {
        total,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(total / +limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения товаров:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ✅ GET PRODUCTS BY CATEGORY (including subcategories)
const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { page = "1", limit = "20" } = req.query;

    // Получаем категорию и все её подкатегории
    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    // Собираем ID всех подкатегорий
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

    // Получаем товары из всех категорий
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

export {
  createProduct,
  getProduct,
  getProductById,
  deleteProduct,
  updateProduct,
  getAllProductsForUsers,
  getProductsByCategory,
};
