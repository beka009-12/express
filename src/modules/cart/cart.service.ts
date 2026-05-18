import { prisma } from "../../prisma";

class cartService {
  async addToCart(userId: number, productId: number, quantity = 1) {
    if (quantity <= 0) throw new Error("Количество должно быть больше 0");

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true, archivedAt: null },
      select: { id: true, stockCount: true },
    });

    if (!product) throw new Error("Товар не найден");

    const existing = await prisma.cart.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stockCount < newQty) {
        throw new Error(`В наличии только ${product.stockCount} шт.`);
      }

      return prisma.cart.update({
        where: { userId_productId: { userId, productId } },
        data: { quantity: newQty },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              newPrice: true,
              stockCount: true,
              productImages: { take: 1, orderBy: { sortOrder: "asc" } },
            },
          },
        },
      });
    }

    if (product.stockCount < quantity) {
      throw new Error(`В наличии только ${product.stockCount} шт.`);
    }

    return prisma.cart.create({
      data: { userId, productId, quantity },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            newPrice: true,
            stockCount: true,
            productImages: { take: 1, orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });
  }

  async getCart(userId: number) {
    const items = await prisma.cart.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            newPrice: true,
            stockCount: true,
            isActive: true,
            brandName: true,
            productImages: { take: 1, orderBy: { sortOrder: "asc" } },
            store: { select: { id: true, name: true, logo: true } },
          },
        },
      },
    });

    const total = items.reduce((sum, item) => {
      const price = Number(item.product.newPrice ?? item.product.price);
      return sum + price * item.quantity;
    }, 0);

    return {
      items,
      total: Number(total.toFixed(2)),
      count: items.length,
    };
  }

  async updateQuantity(userId: number, productId: number, quantity: number) {
    if (quantity <= 0) throw new Error("Количество должно быть больше 0");

    const [cartItem, product] = await Promise.all([
      prisma.cart.findUnique({
        where: { userId_productId: { userId, productId } },
      }),
      prisma.product.findUnique({
        where: { id: productId },
        select: { stockCount: true },
      }),
    ]);

    if (!cartItem) throw new Error("Товар не найден в корзине");
    if (!product || product.stockCount < quantity) {
      throw new Error(`В наличии только ${product?.stockCount ?? 0} шт.`);
    }

    return prisma.cart.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity },
      include: {
        product: {
          select: { id: true, title: true, price: true, newPrice: true },
        },
      },
    });
  }

  async removeFromCart(userId: number, productId: number) {
    const item = await prisma.cart.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!item) throw new Error("Товар не найден в корзине");

    await prisma.cart.delete({
      where: { userId_productId: { userId, productId } },
    });

    return { message: "Товар удалён из корзины" };
  }

  async clearCart(userId: number) {
    await prisma.cart.deleteMany({ where: { userId } });
    return { message: "Корзина очищена" };
  }
}

export const CartService = new cartService();
