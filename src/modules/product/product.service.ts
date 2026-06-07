import { Prisma } from "@prisma/client";
import { supabase } from "../../plugin/supabase";
import { prisma } from "../../prisma";
import { CreateProductDto } from "./product.validation";

export class ProductService {
  // ? ✅ CREATE PRODUCT
  async createProduct(
    ownerId: number,
    dto: CreateProductDto,
    imageData: Array<{ url: string; isMain?: boolean; altText?: string }>,
  ) {
    const store = await prisma.store.findFirst({
      where: { ownerId },
    });

    if (!store) {
      throw new Error(
        "У вас нет магазина. Пожалуйста, создайте магазин перед добавлением товаров.",
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new Error("Категория не найдена");
    }

    if (dto.newPrice && dto.newPrice >= dto.price) {
      throw new Error("Цена со скидкой должна быть меньше основной цены");
    }

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        newPrice: dto.newPrice,
        stockCount: dto.stockCount,
        brandName: dto.brandName,
        sizes: dto.sizes,
        colors: dto.colors,
        material: dto.material,
        gender: dto.gender,
        season: dto.season,
        sku: dto.sku,
        isActive: true,
      },
      include: { category: true, store: true },
    });

    const productImagesData = imageData.map((img, index) => ({
      productId: product.id,
      url: img.url,
      altText: img.altText || null,
      isMain: img.isMain || index === 0,
      sortOrder: index,
    }));

    await prisma.productImage.createMany({
      data: productImagesData,
    });

    // ? Возвращаем товар с изображениями
    return await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        store: { select: { id: true, name: true, logo: true } },
        productImages: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  // ? ✅ GET PRODUCT BY ID
  async getProductByIdPublic(productId: number) {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        isActive: true,
        archivedAt: null,
      },
      include: {
        category: true,
        store: {
          select: { id: true, name: true, logo: true, isVerified: true },
        },
        productImages: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) return null;
    return product;
  }

  // ? ✅ GET PRODUCT BY ID FOR OWNER
  async getProductById(productId: number, ownerId?: number) {
    const where: Prisma.ProductWhereInput = { id: productId };

    if (ownerId) {
      where.store = { ownerId };
    }

    return await prisma.product.findFirst({
      where,
      include: {
        category: true,
        store: true,
        productImages: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  // ? ✅ GET SIMILAR PRODUCTS
  async getSimilarProducts(productId: number, limit = 10) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) throw new Error("Товар не найден");

    const where: Prisma.ProductWhereInput = {
      categoryId: product.categoryId,
      id: { not: productId },
      isActive: true,
      archivedAt: null,
    };

    const orConditions: Prisma.ProductWhereInput[] = [];

    // 1. Тот же бренд
    if (product.brandName) {
      orConditions.push({ brandName: product.brandName });
    }

    // 2. Тот же пол
    if (product.gender) {
      orConditions.push({ gender: product.gender });
    }

    // 3. Тот же сезон
    if (product.season) {
      orConditions.push({ season: product.season });
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    const similarProducts = await prisma.product.findMany({
      where,
      take: limit,
      orderBy: [
        { soldCount: "desc" }, // сначала популярные
        { createdAt: "desc" }, // потом новые
      ],
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
        productImages: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
    });

    if (similarProducts.length < 3) {
      return this.getFallbackSimilarProducts(productId, limit);
    }

    return similarProducts;
  }

  // ? ✅ DELETE PRODUCT
  async deleteProduct(productId: number, ownerId: number) {
    return await prisma.$transaction(async (tx) => {
      // ? Получаем товар с магазином и изображениями
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          store: true,
          productImages: true,
        },
      });

      if (!product) {
        throw new Error("Товар не найден");
      }

      if (product.store.ownerId !== ownerId) {
        throw new Error("У вас нет прав на удаление этого товара");
      }

      // ? Удаляем изображения из Supabase
      if (product.productImages.length > 0) {
        const pathsToDelete = product.productImages.map((img) => {
          // ? Извлекаем путь из URL (например: uploads/filename.jpg)
          const urlParts = img.url.split("/");
          return urlParts.slice(-2).join("/");
        });

        try {
          await supabase.storage.from("product-image").remove(pathsToDelete);
        } catch (err) {
          console.error("Ошибка удаления файлов из Supabase:", err);
          // Не прерываем удаление товара из-за ошибки в хранилище
        }
      }

      // Мягкое удаление (рекомендуется для MVP и дальше)
      await tx.product.update({
        where: { id: productId },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      return { message: "Товар успешно удалён" };
    });
  }

  // ? ✅ GET ALL PRODUCTS
  async getProductsInfinite({
    cursor, // id последнего товара с предыдущей страницы
    limit = 20,
    search,
    categoryId,
    minPrice,
    maxPrice,
    gender,
    season,
    brandName,
    sort = "newest",
  }: {
    cursor?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    gender?: string;
    season?: string;
    brandName?: string;
    sort?: string;
  }) {
    const take = Math.min(Math.max(limit, 8), 50);

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      archivedAt: null,
    };

    if (categoryId) where.categoryId = categoryId;
    if (gender) where.gender = gender as any;
    if (season) where.season = season as any;
    if (brandName)
      where.brandName = { contains: brandName, mode: "insensitive" };

    const andFilters: Prisma.ProductWhereInput[] = [];

    if (search) {
      andFilters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { brandName: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const min = minPrice ?? 0;
      const max = maxPrice ?? 99999999;
      andFilters.push({
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

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    // ? Сортировка
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    if (sort === "price_desc") orderBy = { price: "desc" };
    if (sort === "popular") orderBy = { soldCount: "desc" };

    const products = await prisma.product.findMany({
      where,
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }), // Cursor pagination
      orderBy,
      include: {
        store: {
          select: { id: true, name: true, logo: true, isVerified: true },
        },
        productImages: {
          orderBy: { sortOrder: "asc" },
          take: 1, // только главное фото
        },
        category: true,
      },
    });

    const nextCursor =
      products.length > 0 ? products[products.length - 1].id : null;

    return {
      products,
      nextCursor,
      hasMore: products.length === take,
    };
  }

  // ? ✅ GET PRODUCTS BY CATEGORY
  async getProductsByCategory(
    categoryId: number,
    filters: {
      page?: number;
      limit?: number;
      minPrice?: number;
      maxPrice?: number;
      sort?: string;
    },
  ) {
    const {
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      sort = "createdAt",
    } = filters;

    // ! Получаем категорию + все вложенные
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        children: {
          include: { children: true },
        },
      },
    });

    if (!category) throw new Error("Категория не найдена");

    const categoryIds = this.getAllCategoryIds(category);

    const where: Prisma.ProductWhereInput = {
      categoryId: { in: categoryIds },
      isActive: true,
      archivedAt: null,
    };

    // ! Добавляем фильтры цены при необходимости
    if (minPrice || maxPrice) {
      const min = minPrice ?? 0;
      const max = maxPrice ?? 99999999;
      where.OR = [
        {
          AND: [
            { newPrice: { not: null } },
            { newPrice: { gte: min, lte: max } },
          ],
        },
        { AND: [{ newPrice: null }, { price: { gte: min, lte: max } }] },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort === "price" ? "price" : "createdAt"]: "desc" },
        include: {
          category: true,
          store: {
            select: { id: true, name: true, logo: true, isVerified: true },
          },
          productImages: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      }),
    ]);

    return {
      products,
      category,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ? ✅ UPDATE PRODUCT
  async updateProduct(
    productId: number,
    ownerId: number,
    dto: {
      title?: string;
      description?: string;
      price?: number;
      newPrice?: number | null;
      stockCount?: number;
      categoryId?: number;
      sizes?: string[];
      colors?: string[];
      gender?: string;
      season?: string;
      brandName?: string | null;
      material?: string | null;
    },
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) throw new Error("Товар не найден");
    if (product.store.ownerId !== ownerId) throw new Error("Нет доступа");

    const parsedPrice = dto.price ?? Number(product.price);
    const parsedNewPrice =
      dto.newPrice !== undefined
        ? dto.newPrice
        : product.newPrice !== null
          ? Number(product.newPrice)
          : null;

    if (parsedNewPrice !== null && parsedNewPrice >= parsedPrice) {
      throw new Error("Цена со скидкой должна быть меньше основной");
    }

    const stockCount = dto.stockCount ?? product.stockCount;

    return await prisma.product.update({
      where: { id: productId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.price !== undefined && { price: parsedPrice }),
        newPrice: parsedNewPrice,
        stockCount,
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        brandName: dto.brandName !== undefined ? dto.brandName : product.brandName,
        ...(dto.sizes && { sizes: dto.sizes }),
        ...(dto.colors && { colors: dto.colors }),
        ...(dto.gender && { gender: dto.gender as any }),
        ...(dto.season && { season: dto.season as any }),
        ...(dto.material !== undefined && { material: dto.material }),
        archivedAt: stockCount === 0 ? new Date() : null,
        isActive: stockCount > 0,
      },
      include: {
        category: true,
        store: { select: { id: true, name: true, logo: true } },
        productImages: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  private getAllCategoryIds(category: any): number[] {
    const ids: number[] = [category.id];
    if (category.children?.length) {
      for (const child of category.children) {
        ids.push(...this.getAllCategoryIds(child));
      }
    }

    return ids;
  }

  private async getFallbackSimilarProducts(productId: number, limit: number) {
    return await prisma.product.findMany({
      where: {
        id: { not: productId },
        isActive: true,
        archivedAt: null,
      },
      take: limit,
      orderBy: { soldCount: "desc" },
      include: {
        category: true,
        store: { select: { id: true, name: true, logo: true } },
        productImages: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    });
  }

  async getMyProducts(ownerId: number) {
    const store = await prisma.store.findFirst({ where: { ownerId } });
    if (!store) return [];
    return prisma.product.findMany({
      where: { storeId: store.id, archivedAt: null },
      include: {
        category: true,
        productImages: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const productService = new ProductService();
