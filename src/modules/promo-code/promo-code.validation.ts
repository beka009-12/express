import { z } from "zod";

export const CreatePromoCodeDto = z
  .object({
    code: z.string().min(1).max(50),
    discount: z
      .number()
      .int()
      .min(1, "Скидка должна быть от 1 до 100%")
      .max(100, "Скидка должна быть от 1 до 100%"),
    usageLimit: z.number().int().min(1),
    expiresAt: z.string().datetime(),
  })
  .refine((data) => new Date(data.expiresAt) > new Date(), {
    message: "Дата истечения должна быть в будущем",
    path: ["expiresAt"],
  });

export type CreatePromoCodeDto = z.infer<typeof CreatePromoCodeDto>;
