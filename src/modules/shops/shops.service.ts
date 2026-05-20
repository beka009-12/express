import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "../../prisma";
import {
  CreateShopDto,
  UpdateShopDto,
  ShopsListQuery,
  ShopProductsQuery,
} from "./shops.validation";

class ShopsService {
  async createShop(ownerId: number, dto: CreateShopDto) {
    const existing = await prisma.store.findFirst({ where: { ownerId } });
    if (existing) throw new Error("SHOP_EXISTS");

    return prisma.store.create({ data: { ...dto, ownerId } });
  }

  async getAllShops({ page, limit }: ShopsListQuery) {
    const where = { isActive: true };

    const [total, shops] = await Promise.all([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: "desc" },
        select: {
          id: true,
          name: true,
          logo: true,
          region: true,
          isVerified: true,
          rating: true,
          _count: {
            select: {
              products: { where: { isActive: true, archivedAt: null } },
            },
          },
        },
      }),
    ]);

    return {
      shops,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMyShop(ownerId: number) {
    const shop = await prisma.store.findFirst({
      where: { ownerId },
      include: {
        _count: {
          select: {
            products: { where: { isActive: true, archivedAt: null } },
            reviews: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!shop) throw new Error("SHOP_NOT_FOUND");
    return shop;
  }

  async getShopById(shopId: number, query: ShopProductsQuery) {
    const shop = await prisma.store.findFirst({
      where: { id: shopId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        address: true,
        region: true,
        isVerified: true,
        rating: true,
        createdAt: true,
        owner: { select: { id: true, name: true } },
      },
    });

    if (!shop) throw new Error("SHOP_NOT_FOUND");

    const { cursor, limit, minPrice, maxPrice, categoryId, sort } = query;

    const where: Prisma.ProductWhereInput = {
      storeId: shopId,
      isActive: true,
      archivedAt: null,
      ...(cursor ? { id: { lt: cursor } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...this.buildPriceFilter(minPrice, maxPrice),
    };

    const products = await prisma.product.findMany({
      where,
      take: limit + 1,
      orderBy: this.buildOrderBy(sort),
      select: {
        id: true,
        title: true,
        price: true,
        newPrice: true,
        soldCount: true,
        stockCount: true,
        createdAt: true,
        productImages: {
          where: { isMain: true },
          take: 1,
          select: { url: true, altText: true },
        },
        category: { select: { id: true, name: true } },
      },
    });

    const hasMore = products.length > limit;
    const items = hasMore ? products.slice(0, limit) : products;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { shop, products: items, nextCursor, hasMore };
  }

  async updateShop(ownerId: number, dto: UpdateShopDto) {
    const shop = await this.findOwnedShop(ownerId);
    return prisma.store.update({ where: { id: shop.id }, data: dto });
  }

  async deactivateShop(ownerId: number) {
    const shop = await this.findOwnedShop(ownerId);
    if (!shop.isActive) throw new Error("SHOP_ALREADY_INACTIVE");

    const cancelStatuses: OrderStatus[] = [
      "PENDING",
      "PAID",
      "PROCESSING",
      "SHIPPED",
    ];

    await prisma.$transaction([
      prisma.store.update({
        where: { id: shop.id },
        data: { isActive: false },
      }),
      prisma.product.updateMany({
        where: { storeId: shop.id },
        data: { isActive: false },
      }),
      prisma.order.updateMany({
        where: { storeId: shop.id, status: { in: cancelStatuses } },
        data: { status: "CANCELED" },
      }),
    ]);

    return { message: "Магазин деактивирован" };
  }

  async reactivateShop(ownerId: number) {
    const shop = await this.findOwnedShop(ownerId);
    if (shop.isActive) throw new Error("SHOP_ALREADY_ACTIVE");

    await prisma.$transaction([
      prisma.store.update({
        where: { id: shop.id },
        data: { isActive: true },
      }),
      prisma.product.updateMany({
        where: { storeId: shop.id },
        data: { isActive: true },
      }),
    ]);

    return { message: "Магазин реактивирован" };
  }

  private async findOwnedShop(ownerId: number) {
    const shop = await prisma.store.findFirst({ where: { ownerId } });
    if (!shop) throw new Error("SHOP_NOT_FOUND");
    return shop;
  }

  private buildPriceFilter(
    minPrice?: number,
    maxPrice?: number,
  ): Prisma.ProductWhereInput {
    if (!minPrice && !maxPrice) return {};

    const conditions: Prisma.ProductWhereInput[] = [];

    if (minPrice && maxPrice) {
      conditions.push(
        { newPrice: { not: null, gte: minPrice, lte: maxPrice } },
        { newPrice: null, price: { gte: minPrice, lte: maxPrice } },
      );
    } else if (minPrice) {
      conditions.push(
        { newPrice: { not: null, gte: minPrice } },
        { newPrice: null, price: { gte: minPrice } },
      );
    } else if (maxPrice) {
      conditions.push(
        { newPrice: { not: null, lte: maxPrice } },
        { newPrice: null, price: { lte: maxPrice } },
      );
    }

    return { OR: conditions };
  }

  private buildOrderBy(
    sort: string,
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case "price_asc":
        return { price: "asc" };
      case "price_desc":
        return { price: "desc" };
      case "popular":
        return { soldCount: "desc" };
      default:
        return { createdAt: "desc" };
    }
  }
}

export const shopsService = new ShopsService();
