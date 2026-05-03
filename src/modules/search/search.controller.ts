import { Request, Response } from "express";
import Fuse from "fuse.js";
import { prisma } from "../../prisma";

interface ProductFilters {
  isActive: boolean;
  archivedAt: null;
  categoryId?: number;
  brandName?: string;
  storeId?: number;
  stockCount?: { gt: number };
  price?: {
    gte?: number;
    lte?: number;
  };
}

const searchProducts = async (req: Request, res: Response) => {
  try {
    const {
      search,
      page = "1",
      limit = "20",
      categoryId,
      minPrice,
      maxPrice,
      brandName,
      storeId,
      inStock,
    } = req.query;

    const filters: ProductFilters = {
      isActive: true,
      archivedAt: null,
    };

    if (categoryId) filters.categoryId = Number(categoryId);
    if (brandName) filters.brandName = String(brandName);
    if (storeId) filters.storeId = Number(storeId);
    if (inStock === "true") filters.stockCount = { gt: 0 };

    if (minPrice || maxPrice) {
      filters.price = {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      };
    }

    let products = await prisma.product.findMany({
      where: filters,
      include: { category: true, store: true },
      orderBy: { createdAt: "desc" }, // новые первыми
    });

    // Уточняем цену с учётом newPrice (скидка не индексирована)
    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;

      products = products.filter((p) => {
        const actualPrice = Number(p.newPrice ?? p.price);
        return actualPrice >= min && actualPrice <= max;
      });
    }

    if (search && typeof search === "string") {
      const fuse = new Fuse(products, {
        keys: [
          { name: "title", weight: 0.7 },
          { name: "tags", weight: 0.3 },
          { name: "brandName", weight: 0.2 },
        ],
        threshold: 0.3,
        distance: 100,
        ignoreLocation: true,
      });

      products = fuse.search(search).map((r) => r.item);
    }

    const total = products.length;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedProducts = products.slice(startIndex, startIndex + limitNum);

    return res.json({
      products: paginatedProducts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export { searchProducts };
