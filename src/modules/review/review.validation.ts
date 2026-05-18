import { z } from "zod";

export const CreateReviewDto = z.object({
  productId: z.number().int().positive(),
  storeId: z.number().int().positive().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000).optional().nullable(),
});

export type CreateReviewDto = z.infer<typeof CreateReviewDto>;
