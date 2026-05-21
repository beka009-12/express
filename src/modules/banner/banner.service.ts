import { prisma } from "../../prisma";
import { promoCodeService } from "../promo-code/promo-code.service";

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
  async create(storeId: number, data: CreateBannerData) {
    return prisma.$transaction(async (tx) => {
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

      const products = await tx.product.findMany({
        where: {
          id: { in: data.productIds },
          storeId,
        },
        select: { id: true, price: true },
      });

      if (products.length !== data.productIds.length) {
        throw new Error(
          "Некоторые товары не найдены или не принадлежат вашему магазину.",
        );
      }

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

      let finalPrice = BASE_BANNER_PRICE;
      let appliedPromoId: number | null = null;

      if (data.promoCode) {
        const result = await promoCodeService.validateInTx(
          tx,
          data.promoCode,
          storeId,
        );
        finalPrice = result.finalPrice;
        appliedPromoId = result.promoId;
      }

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

      await Promise.all(
        products.map((p) =>
          tx.product.update({
            where: { id: p.id },
            data: { newPrice: calculateNewPrice(Number(p.price)) },
          }),
        ),
      );

      if (appliedPromoId !== null) {
        await promoCodeService.recordUsageInTx(
          tx,
          appliedPromoId,
          banner.id,
          storeId,
        );
      }

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
