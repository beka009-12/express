import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { ReviewService } from "./review.service";
import { CreateReviewDto } from "./review.validation";

const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreateReviewDto.safeParse({
      ...req.body,
      productId: Number(req.body.productId),
      storeId: req.body.storeId ? Number(req.body.storeId) : undefined,
      rating: Number(req.body.rating),
    });

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const review = await ReviewService.createReview(req.user!.id, parsed.data);
    return res.status(201).json({ message: "Отзыв добавлен", review });
  } catch (error: any) {
    console.error("createReview error:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("уже оставили")) {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Неверный ID товара" });
    }

    const result = await ReviewService.getProductReviews(productId, {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("getProductReviews error:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await ReviewService.getMyReviews(req.user!.id);
    return res.status(200).json({ reviews });
  } catch (error) {
    console.error("getMyReviews error:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = Number(req.params.id);

    if (!reviewId || isNaN(reviewId)) {
      return res.status(400).json({ message: "Неверный ID отзыва" });
    }

    const result = await ReviewService.deleteReview(reviewId, req.user!.id);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("deleteReview error:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Нет доступа") {
      return res.status(403).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { createReview, getProductReviews, getMyReviews, deleteReview };
