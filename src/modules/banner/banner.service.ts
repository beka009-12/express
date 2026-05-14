import { prisma } from "../../prisma";

const MAX_TOTAL_SLOTS = 5;
const BASE_BANNER_PRICE = 500;

interface CreateBannerData {
  title: string;
  accent: string;
  description: string;
  decoNum: string;
  promoTag: string;
  color: string;
  promoType: "PERCENT" | "FIXED_PRICE" | "BUY_ONE_GET" | "SEASONAL";
  discount?: number;
  fixedPrice?: number;
  deadline: string;
  productIds: number[];
  promoCode?: string;
}

class BannerService {
  // ? ✅ Создание баннера
  async create(storeId: number, data: CreateBannerData) {
    return prisma.$transaction(async (tx) => {
      // 1. Проверка на наличие активного баннера
      const existingBanner = await tx.banner.findFirst({
        where: {
          storeId,
          isActive: true,
          status: { in: ["PENDING", "APPROVED"] },
          deadline: { gt: new Date() },
        },
      });

      if (existingBanner) {
        throw new Error("У вашего магазина уже есть активный баннер.");
      }

      // 2. КРИТИЧЕСКАЯ ИСПРАВЛЕННАЯ ПРОВЕРКА ПРОДУКТОВ
      // Ищем товары ТОЛЬКО этого магазина
      const products = await tx.product.findMany({
        where: {
          id: { in: data.productIds },
          storeId: storeId, // Защита от "кражи" чужих товаров
        },
        select: { id: true, price: true },
      });

      // Если нашли меньше товаров, чем передали — значит в списке были чужие ID
      if (products.length !== data.productIds.length) {
        throw new Error(
          "Некоторые товары не найдены или не принадлежат вашему магазину.",
        );
      }

      // 3. Расчет новой цены для товаров (Логика пересчета)
      const calculateNewPrice = (originalPrice: number) => {
        const price = Number(originalPrice);
        switch (data.promoType) {
          case "PERCENT":
            return price - (price * (data.discount ?? 0)) / 100;
          case "FIXED_PRICE":
            return Number(data.fixedPrice) ?? price;
          default:
            return price;
        }
      };

      // 4. Логика промокода
      let finalPrice = BASE_BANNER_PRICE;
      if (data.promoCode) {
        const promo = await tx.promoCode.findFirst({
          where: {
            code: data.promoCode,
            isActive: true,
            expiresAt: { gt: new Date() },
            usedCount: { lt: tx.promoCode.fields.usageLimit },
          },
        });

        if (promo) {
          finalPrice =
            BASE_BANNER_PRICE - (BASE_BANNER_PRICE * promo.discount) / 100;
          await tx.promoCode.update({
            where: { id: promo.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      // 5. Создание баннера
      const banner = await tx.banner.create({
        data: {
          storeId,
          title: data.title,
          accent: data.accent,
          description: data.description,
          decoNum: data.decoNum,
          promoTag: data.promoTag,
          color: data.color,
          promoType: data.promoType,
          discount: data.discount ?? null,
          fixedPrice: data.fixedPrice ?? null,
          deadline: new Date(data.deadline),
          products: {
            create: products.map((p) => ({
              productId: p.id,
              originalPrice: p.price,
            })),
          },
          slot: {
            create: {
              price: finalPrice,
              isPaid: finalPrice === 0,
              startAt: new Date(),
              endAt: new Date(data.deadline),
            },
          },
        },
        include: { slot: true, products: true },
      });

      // 6. АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ newPrice В ТАБЛИЦЕ PRODUCT
      // Чтобы на всем сайте цена отображалась со скидкой
      await Promise.all(
        products.map((p) =>
          tx.product.update({
            where: { id: p.id },
            data: { newPrice: calculateNewPrice(Number(p.price)) },
          }),
        ),
      );

      return banner;
    });
  }

  // ? ✅ Получение активных баннеров
  async getActive() {
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
        deadline: { gt: now },
        slot: { isPaid: true, endAt: { gt: now } },
      },
      include: {
        store: { select: { name: true, isVerified: true } },
        products: {
          take: 3,
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
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return banners.sort(() => Math.random() - 0.5).slice(0, MAX_TOTAL_SLOTS);
  }

  // ? ✅ Подтверждение баннера
  async approve(id: number) {
    return prisma.banner.update({
      where: { id },
      data: { status: "APPROVED", isActive: true },
    });
  }

  // ? ✅ Отклонение баннера
  async reject(id: number, reason: string) {
    return prisma.banner.update({
      where: { id },
      data: {
        status: "REJECTED",
        isActive: false,
        rejectReason: reason,
      },
    });
  }

  // ? ✅ Деактивация баннеров
  async deactivateExpired() {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
      const expired = await tx.banner.findMany({
        where: { deadline: { lt: now }, isActive: true },
        include: { products: true },
      });

      if (expired.length === 0) return;

      const expiredIds = expired.map((b) => b.id);

      // Сбрасываем цены у продуктов этих баннеров
      for (const banner of expired) {
        await Promise.all(
          banner.products.map((p) =>
            tx.product.update({
              where: { id: p.productId },
              data: { newPrice: null },
            }),
          ),
        );
      }

      await tx.banner.updateMany({
        where: { id: { in: expiredIds } },
        data: { isActive: false },
      });
    });
  }
}

export const bannerService = new BannerService();
