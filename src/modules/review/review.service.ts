import { prisma } from "../../prisma";
import { CreateReviewDto } from "./review.validation";

class reviewService {
  async createReview(userId: number, dto: CreateReviewDto) {
    const product = await prisma.product.findFirst({
      where: { id: dto.productId, isActive: true, archivedAt: null },
      select: { id: true, storeId: true },
    });

    if (!product) throw new Error("Товар не найден");

    const existing = await prisma.review.findFirst({
      where: { userId, productId: dto.productId, deletedAt: null },
    });

    if (existing) throw new Error("Вы уже оставили отзыв на этот товар");

    const storeId = dto.storeId ?? product.storeId;

    const review = await prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        storeId,
        rating: dto.rating,
        comment: dto.comment ?? null,
        images: [],
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    await this.recalculateStoreRating(storeId);

    return review;
  }

  async getProductReviews(
    productId: number,
    { page = 1, limit = 10 }: { page?: number; limit?: number },
  ) {
    const where = { productId, isApproved: true, deletedAt: null };

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
    ]);

    // Распределение рейтингов (1-5)
    const ratingDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { productId, isApproved: true, deletedAt: null },
      _count: { rating: true },
    });

    return {
      reviews,
      ratingDistribution,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMyReviews(userId: number) {
    return prisma.review.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            productImages: {
              take: 1,
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
  }

  async deleteReview(reviewId: number, userId: number) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review || review.deletedAt) throw new Error("Отзыв не найден");
    if (review.userId !== userId) throw new Error("Нет доступа");

    await prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });

    if (review.storeId) {
      await this.recalculateStoreRating(review.storeId);
    }

    return { message: "Отзыв удалён" };
  }

  private async recalculateStoreRating(storeId: number) {
    const result = await prisma.review.aggregate({
      where: { storeId, isApproved: true, deletedAt: null },
      _avg: { rating: true },
    });

    await prisma.store.update({
      where: { id: storeId },
      data: { rating: result._avg.rating ?? 0 },
    });
  }
}

export const ReviewService = new reviewService();
