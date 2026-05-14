import { prisma } from "../../prisma";
import { CreateOrderDto } from "./order.validation";
import { DeliveryMethod, OrderStatus, PaymentStatus } from "@prisma/client";

class OrderService {
  async createOrder(userId: number, dto: CreateOrderDto) {
    return await prisma.$transaction(async (tx) => {
      // ! 1. Получаем корзину
      const cartItems = await tx.cart.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              newPrice: true,
              stockCount: true,
              isActive: true,
              archivedAt: true,
              storeId: true,
            },
          },
        },
      });

      if (cartItems.length === 0) {
        throw new Error("Корзина пуста");
      }

      // ! 2. Группируем товары по магазину
      const itemsByStore = new Map<number, typeof cartItems>();

      for (const item of cartItems) {
        const storeId = item.product.storeId;
        if (!itemsByStore.has(storeId)) {
          itemsByStore.set(storeId, []);
        }
        itemsByStore.get(storeId)!.push(item);
      }

      // ! 3. Получаем адрес доставки
      let address;
      if (dto.addressId) {
        address = await tx.address.findUnique({
          where: { id: dto.addressId, userId },
        });
      } else {
        address = await tx.address.findFirst({
          where: { userId, isDefault: true },
        });
      }

      if (!address) {
        throw new Error("Адрес доставки не найден");
      }

      const createdOrders: any[] = [];
      let totalFinalAmount = 0;

      // ! 4. Создаём заказ для каждого магазина
      for (const [storeId, items] of itemsByStore) {
        let totalAmount = 0;
        const orderItemsData: any[] = [];

        for (const item of items) {
          const price = item.product.newPrice ?? item.product.price;
          totalAmount += Number(price) * item.quantity;

          orderItemsData.push({
            productId: item.productId,
            storeId: storeId,
            quantity: item.quantity,
            priceAtBuy: price,
          });
        }

        const deliveryCost = this.calculateDeliveryCost(
          dto.deliveryMethod,
          totalAmount,
        );
        const platformFee = Math.round(totalAmount * 0.08); // 8%
        const finalAmount = totalAmount + deliveryCost + platformFee;

        totalFinalAmount += finalAmount;

        const order = await tx.order.create({
          data: {
            userId,
            storeId,
            totalAmount,
            deliveryCost,
            platformFee,
            finalAmount,
            deliveryMethod: dto.deliveryMethod,
            status: OrderStatus.PENDING,

            deliveryName: address.name,
            deliveryPhone: address.phone,
            deliveryAddress: address.address,
            addressId: address.id,

            items: {
              createMany: { data: orderItemsData },
            },
          },
          include: { items: true },
        });

        createdOrders.push(order as any);
      }

      // ! 5. Создаём один общий платёж
      const payment = await tx.payment.create({
        data: {
          userId,
          amount: totalFinalAmount,
          paymentMethod: "CARD",
          status: PaymentStatus.PENDING,
        },
      });

      // ! 6. Привязываем все заказы к платежу
      await tx.order.updateMany({
        where: { id: { in: createdOrders.map((o) => o.id) } },
        data: { paymentId: payment.id },
      });

      // ! 7. Списываем товары и очищаем корзину
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockCount: { decrement: item.quantity } },
        });
      }

      await tx.cart.deleteMany({ where: { userId } });

      return {
        orders: createdOrders,
        payment,
        totalAmount: totalFinalAmount,
      };
    });
  }

  // ? ✅ Получение заказов пользователя
  // order.service.ts
  async getUserOrders(
    userId: number,
    filters?: {
      status?: OrderStatus;
      limit?: number;
      page?: number;
    },
  ) {
    const { status, limit = 10, page = 1 } = filters || {};
    const skip = (page - 1) * limit;

    return await prisma.order.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      include: {
        store: {
          select: { id: true, name: true, logo: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: true,
                price: true,
                newPrice: true,
                brandName: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
  }

  // ? ✅ Получение деталей конкретного заказа
  async getOrderById(userId: number, orderId: number) {
    if (!orderId) throw new Error("Не указан orderId");

    if (!userId) throw new Error("Не указан userId");

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        store: {
          select: { id: true, name: true, logo: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: true,
                price: true,
                newPrice: true,
                brandName: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new Error("Заказ не найден или у вас нет доступа к нему");
    }

    return order;
  }

  // ? ✅ Отмена заказа
  async cancelOrder(userId: number, orderId: number) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) throw new Error("Заказ не найден");

    if (!["PENDING", "PAID"].includes(order.status)) {
      throw new Error(`Заказ в статусе ${order.status} нельзя отменить`);
    }

    return await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELED },
      include: { items: true },
    });
  }

  private calculateDeliveryCost(
    method: DeliveryMethod,
    orderAmount: number,
  ): number {
    switch (method) {
      case DeliveryMethod.PICKUP:
        return 0;
      case DeliveryMethod.COURIER_BISHKEK:
        return orderAmount >= 3000 ? 0 : 250;
      case DeliveryMethod.COURIER_REGION:
        return 450;
      case DeliveryMethod.EXPRESS:
        return 600;
      default:
        return 300;
    }
  }
}

export const orderService = new OrderService();
