// product.validation.ts
import { z } from "zod";

export const CreateProductDto = z.object({
  categoryId: z.number().int().positive(),

  title: z.string().min(3).max(255).trim(),
  description: z.string().min(10).trim(),

  price: z.number().positive(),
  newPrice: z.number().positive().optional().nullable(),

  stockCount: z.number().int().nonnegative().default(0),
  brandName: z.string().optional().nullable(),

  sizes: z.array(z.string()).min(1, "Укажите хотя бы один размер"),
  colors: z.array(z.string()).min(1, "Укажите хотя бы один цвет"),

  material: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]),
  season: z.enum(["SPRING_SUMMER", "AUTUMN_WINTER", "ALL_SEASON"]),

  sku: z.string().optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductDto>;
