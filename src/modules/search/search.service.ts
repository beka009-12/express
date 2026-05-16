import Fuse from "fuse.js";
import { prisma } from "../../prisma";
import { Gender, Season } from "@prisma/client";

export interface SearchQuery {
  search?: string;
  page?: string;
  limit?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  brandName?: string;
  storeId?: string;
  inStock?: string;
  gender?: string;
  season?: string;
  sizes?: string;
  colors?: string;
  sortBy?: string;
  sortOrder?: string;
}

async function getCategoryIds(categoryId: number): Promise<number[]> {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, parentId: true },
  });
  const childIds: number[] = [];
  const queue = [categoryId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    childIds.push(current);
    const children = categories.filter((c) => c.parentId === current);
    queue.push(...children.map((c) => c.id));
  }
  return childIds;
}

export async function searchProductsService(query: SearchQuery) {
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
    gender,
    season,
    sizes,
    colors,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const whereBase: Record<string, unknown> = {
    isActive: true,
    archivedAt: null,
  };

  if (brandName) whereBase.brandName = String(brandName);
  if (storeId) whereBase.storeId = Number(storeId);
  if (inStock === "true") whereBase.stockCount = { gt: 0 };

  if (categoryId) {
    const ids = await getCategoryIds(Number(categoryId));
    whereBase.categoryId = { in: ids };
  }

  if (gender && Object.values(Gender).includes(gender as Gender))
    whereBase.gender = gender as Gender;
  if (season && Object.values(Season).includes(season as Season))
    whereBase.season = season as Season;
  if (sizes)
    whereBase.sizes = { hasSome: sizes.split(",").map((s) => s.trim()) };
  if (colors)
    whereBase.colors = { hasSome: colors.split(",").map((c) => c.trim()) };

  if (minPrice || maxPrice) {
    whereBase.price = {
      ...(minPrice && { gte: Number(minPrice) }),
      ...(maxPrice && { lte: Number(maxPrice) }),
    };
  }

  const allowedSortFields = [
    "createdAt",
    "price",
    "soldCount",
    "views",
    "newPrice",
  ];
  const field = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const order = sortOrder === "asc" ? "asc" : "desc";

  let products = await prisma.product.findMany({
    where: whereBase,
    include: {
      category: { select: { id: true, name: true } },
      store: { select: { id: true, name: true, logo: true, isVerified: true } },
      productImages: { where: { isMain: true }, take: 1 },
    },
  });

  if (minPrice || maxPrice) {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;
    products = products.filter((p) => {
      const actualPrice = Number(p.newPrice ?? p.price);
      return actualPrice >= min && actualPrice <= max;
    });
  }

  if (search && search.trim().length > 0) {
    const fuse = new Fuse(products, {
      keys: [
        { name: "title", weight: 0.6 },
        { name: "description", weight: 0.2 },
        { name: "brandName", weight: 0.2 },
      ],
      threshold: 0.35,
      distance: 150,
      ignoreLocation: true,
      includeScore: true,
    });
    products = fuse.search(search.trim()).map((r) => r.item);
  }

  const total = products.length;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const startIndex = (pageNum - 1) * limitNum;

  return {
    products: products.slice(startIndex, startIndex + limitNum),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNextPage: startIndex + limitNum < total,
      hasPrevPage: pageNum > 1,
    },
    meta: {
      appliedFilters: {
        ...(search && { search }),
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(brandName && { brandName }),
        ...(gender && { gender }),
        ...(season && { season }),
        ...(minPrice && { minPrice: Number(minPrice) }),
        ...(maxPrice && { maxPrice: Number(maxPrice) }),
        ...(inStock && { inStock: inStock === "true" }),
      },
      sortBy: field,
      sortOrder: order,
    },
  };
}

export async function getSuggestionsService(q: string, limit = 8) {
  if (!q || q.trim().length < 2) return { suggestions: [] };
  const term = q.trim();
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      archivedAt: null,
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { brandName: { contains: term, mode: "insensitive" } },
      ],
    },
    select: { title: true, brandName: true },
    take: 50,
  });
  const seen = new Set<string>();
  const suggestions: string[] = [];
  for (const p of products) {
    if (suggestions.length >= limit) break;
    if (!seen.has(p.title)) {
      seen.add(p.title);
      suggestions.push(p.title);
    }
    if (p.brandName && !seen.has(p.brandName) && suggestions.length < limit) {
      seen.add(p.brandName);
      suggestions.push(p.brandName);
    }
  }
  return { suggestions };
}
