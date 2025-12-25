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
    const files = req.files as Express.Multer.File[];
    const {
      categoryId,
      brandId,
      title,
      description,
      sizes,
      colors,
      price,
      newPrice,
      stockCount,
      tags,
    } = req.body;

    if (!categoryId || !brandId || !title || !description || !price) {
      return res.status(400).json({ message: "Отсутствуют обязательные поля" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: req.user.id },
    });
    if (!store)
      return res.status(400).json({ message: "Сначала создайте магазин" });

    // Загрузка файлов
    const uploadedUrls: string[] = [];
    if (files && files.length > 0) {
      const MAX_FILES = 6;
      if (files.length > MAX_FILES) {
        return res
          .status(400)
          .json({ message: `Максимум ${MAX_FILES} файлов можно загрузить.` });
      }

      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname}`;

        const { data, error } = await supabase.storage
          .from("product-image")
          .upload(`uploads/${fileName}`, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("product-image")
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    const product = await prisma.product.create({
      data: {
        shopId: store.id,
        categoryId: Number(categoryId),
        brandId: Number(brandId),
        title,
        description,
        images: uploadedUrls,
        sizes: sizes ? JSON.parse(sizes) : [],
        colors: colors ? JSON.parse(colors) : [], // массив строк
        price: Number(price),
        newPrice: newPrice ? Number(newPrice) : null,
        stockCount: stockCount ? Number(stockCount) : 0,
        tags: tags ? JSON.parse(tags) : [],
        isArchived: false,
        archivedAt: null,
      },
      include: {
        category: true,
        brand: true,
      },
    });

    return res.status(201).json({ message: "Товар создан", product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка при создании товара" });
  }
};

// ✅ GET PRODUCTS (seller only)
const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!store) {
      return res.status(404).json({ message: "Сначала создайте магазин" });
    }

    const products = await prisma.product.findMany({
      where: { shopId: store.id },
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ✅ GET PRODUCT BY ID
const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        store: true,
        brand: true,
        category: true,
      },
    });

    if (!product) return res.status(404).json({ message: "Товар не найден" });

    return res.status(200).json(product);
  } catch (error) {
    console.error(error);
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

    await prisma.product.delete({ where: { id: Number(id) } });

    return res.status(200).json({ message: "Товар удалён" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ✅ UPDATE PRODUCT
const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      categoryId,
      brandId,
      title,
      description,
      images,
      sizes,
      colors,
      price,
      newPrice,
      stockCount,
      tags,
    } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { store: true },
    });

    if (!product) return res.status(404).json({ message: "Товар не найден" });

    if (product.store.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Нет доступа для изменения" });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        title: title ?? product.title,
        description: description ?? product.description,
        images: images ?? product.images,
        sizes: sizes ?? product.sizes,
        colors: colors ?? product.colors,
        price: price !== undefined ? Number(price) : product.price,
        newPrice: newPrice !== undefined ? Number(newPrice) : product.newPrice,
        stockCount:
          stockCount !== undefined ? Number(stockCount) : product.stockCount,
        tags: tags ?? product.tags,

        isArchived: stockCount === 0,
        archivedAt: stockCount === 0 ? new Date() : null,

        // Обновление связей через connect
        category: categoryId
          ? { connect: { id: Number(categoryId) } }
          : undefined,
        brand: brandId ? { connect: { id: Number(brandId) } } : undefined,
      },
    });

    return res.status(200).json({ message: "Товар обновлён", updatedProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка при обновлении товара" });
  }
};

const getAllProductsForUsers = async (req: Request, res: Response) => {
  try {
    const { category, brand, minPrice, maxPrice, inStock } = req.query;

    const filters: any = {};

    if (category) filters.category = String(category);
    if (brand) filters.brand = String(brand);
    if (inStock) filters.inStock = inStock === "true";

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price = Number(minPrice);
      if (maxPrice) filters.price = Number(maxPrice);
    }

    const products = await prisma.product.findMany({
      where: {
        ...filters,
        isArchived: false,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка при получении товаров" });
  }
};

export {
  createProduct,
  getProduct,
  getProductById,
  deleteProduct,
  updateProduct,
  getAllProductsForUsers,
};
