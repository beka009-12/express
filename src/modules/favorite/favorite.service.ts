import { prisma } from "../../prisma";

class favoriteService {
  // ? ✅ Добавление в избранное
  async addFavorite(userId: number, productId: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });

    if (!product) {
      throw new Error("Продукт не найден");
    }

    if (!product.isActive) {
      throw new Error("Товар неактивен");
    }

    return prisma.favorite.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            newPrice: true,
            images: true,
          },
        },
      },
    });
  }

  // ? ✅ Получение избранного
  async getFavorites(userId: number) {
    return prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            newPrice: true,
            images: true,
            isActive: true,
            stockCount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ? ✅ Удаление из избранного
  async deleteFavorite(userId: number, productId: number) {
    const result = await prisma.favorite.deleteMany({
      where: { userId, productId },
    });

    if (result.count === 0) {
      throw new Error("Товар не найден в избранном");
    }

    return { message: "Успешно удалено" };
  }
}

export const FavoriteService = new favoriteService();
