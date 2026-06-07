import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma";
import { CreatePromoCodeDto } from "./promo-code.validation";

const BASE_BANNER_PRICE = 500;

export type ValidateResult =
  | {
      valid: true;
      discount: number;
      originalPrice: number;
      finalPrice: number;
      expiresAt: Date;
    }
  | { valid: false; reason: string };

class PromoCodeService {
  async create(dto: CreatePromoCodeDto) {
    const code = dto.code.toUpperCase();
    const existing = await prisma.promoCode.findUnique({ where: { code } });
    if (existing) throw new Error("PROMO_CODE_EXISTS");

    return prisma.promoCode.create({
      data: {
        code,
        discount: dto.discount,
        usageLimit: dto.usageLimit,
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }

  async findAll() {
    return prisma.promoCode.findMany({
      orderBy: { id: "desc" },
      include: {
        usages: {
          orderBy: { usedAt: "desc" },
          include: {
            store: { select: { id: true, name: true } },
            banner: { select: { id: true, title: true } },
          },
        },
      },
    });
  }

  async deactivate(id: number) {
    const promo = await prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new Error("PROMO_NOT_FOUND");

    return prisma.promoCode.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // For OWNER validate endpoint — non-transactional read
  async validate(code: string, ownerId: number): Promise<ValidateResult> {
    const store = await prisma.store.findFirst({
      where: { ownerId, isActive: true },
      select: { id: true },
    });
    if (!store) return { valid: false, reason: "Магазин не найден" };

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive || promo.expiresAt <= new Date()) {
      return { valid: false, reason: "Промокод недействителен или истёк" };
    }
    if (promo.usedCount >= promo.usageLimit) {
      return { valid: false, reason: "Промокод больше недоступен" };
    }

    const alreadyUsed = await prisma.promoCodeUsage.findUnique({
      where: {
        promoCodeId_storeId: { promoCodeId: promo.id, storeId: store.id },
      },
    });
    if (alreadyUsed) {
      return {
        valid: false,
        reason: "Ваш магазин уже использовал этот промокод",
      };
    }

    const finalPrice =
      BASE_BANNER_PRICE - (BASE_BANNER_PRICE * promo.discount) / 100;
    return {
      valid: true,
      discount: promo.discount,
      originalPrice: BASE_BANNER_PRICE,
      finalPrice,
      expiresAt: promo.expiresAt,
    };
  }

  // Called inside banner.$transaction — validates and returns price
  async validateInTx(
    tx: Prisma.TransactionClient,
    code: string,
    storeId: number,
  ): Promise<{ promoId: number; finalPrice: number }> {
    const promo = await tx.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive || promo.expiresAt <= new Date()) {
      throw new Error("PROMO_INVALID");
    }
    if (promo.usedCount >= promo.usageLimit) {
      throw new Error("PROMO_EXHAUSTED");
    }

    const alreadyUsed = await tx.promoCodeUsage.findUnique({
      where: {
        promoCodeId_storeId: { promoCodeId: promo.id, storeId },
      },
    });
    if (alreadyUsed) throw new Error("PROMO_STORE_ALREADY_USED");

    const finalPrice =
      BASE_BANNER_PRICE - (BASE_BANNER_PRICE * promo.discount) / 100;
    return { promoId: promo.id, finalPrice };
  }

  // Called inside banner.$transaction — records usage after banner is created
  async recordUsageInTx(
    tx: Prisma.TransactionClient,
    promoId: number,
    bannerId: number,
    storeId: number,
  ): Promise<void> {
    await Promise.all([
      tx.promoCode.update({
        where: { id: promoId },
        data: { usedCount: { increment: 1 } },
      }),
      tx.promoCodeUsage.create({
        data: { promoCodeId: promoId, bannerId, storeId },
      }),
    ]);
  }
}

export const promoCodeService = new PromoCodeService();
