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
    const { categoryId, brandId, title, description, price, stockCount, tags } =
      req.body;

    if (!req.user?.id)
      return res.status(401).json({ message: "Не авторизован" });

    if (!categoryId || !title || !description || !price)
      return res.status(400).json({ message: "Заполните обязательные поля" });

    const store = await prisma.store.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!store)
      return res.status(400).json({ message: "Сначала создайте магазин" });

    // upload images
    const uploadedUrls: string[] = [];

    if (files?.length) {
      if (files.length > 6)
        return res.status(400).json({ message: "Максимум 6 изображений" });

      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname}`;

        const { data, error } = await supabase.storage
          .from("product-image")
          .upload(`uploads/${fileName}`, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw error;

        const { data: publicUrl } = supabase.storage
          .from("product-image")
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl.publicUrl);
      }
    }

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: Number(categoryId),
        brandId: brandId ? Number(brandId) : undefined,
        title,
        description,
        images: uploadedUrls,
        price: Number(price),
        stockCount: stockCount ? Number(stockCount) : 0,
        tags: tags ? JSON.parse(tags) : [],
      },
      include: { category: true, brand: true },
    });

    res.status(201).json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка создания товара" });
  }
};

// ✅ GET PRODUCTS (seller only)
const getProduct = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ message: "Не авторизован" });

  const store = await prisma.store.findFirst({
    where: { ownerId: req.user.id },
  });

  if (!store) return res.status(404).json({ message: "Магазин не найден" });

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
  });

  res.json(products);
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
  const { id } = req.params;
  const { title, description, price, stockCount, tags, categoryId, brandId } =
    req.body;

  if (!req.user?.id) return res.status(401).json({ message: "Не авторизован" });

  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: { store: true },
  });

  if (!product) return res.status(404).json({ message: "Товар не найден" });

  if (product.store.ownerId !== req.user.id)
    return res.status(403).json({ message: "Нет доступа" });

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      title,
      description,
      price: price ? Number(price) : undefined,
      stockCount: stockCount ? Number(stockCount) : undefined,
      tags,
      archivedAt: stockCount === 0 ? new Date() : null,
      categoryId: categoryId ? Number(categoryId) : undefined,
      brandId: brandId ? Number(brandId) : undefined,
    },
  });

  res.json(updated);
};

const getAllProductsForUsers = async (req: Request, res: Response) => {
  const {
    page = "1",
    limit = "20",
    categoryId,
    brandId,
    minPrice,
    maxPrice,
  } = req.query;

  const filters: any = {
    archivedAt: null,
  };

  if (categoryId) filters.categoryId = Number(categoryId);
  if (brandId) filters.brandId = Number(brandId);

  if (minPrice || maxPrice) {
    filters.price = {
      gte: minPrice ? Number(minPrice) : undefined,
      lte: maxPrice ? Number(maxPrice) : undefined,
    };
  }

  const products = await prisma.product.findMany({
    where: filters,
    skip: (+page - 1) * +limit,
    take: +limit,
    orderBy: { createdAt: "desc" },
  });

  res.json(products);
};

export {
  createProduct,
  getProduct,
  getProductById,
  deleteProduct,
  updateProduct,
  getAllProductsForUsers,
};
