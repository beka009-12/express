import { z } from "zod";

export const CreateShopSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  address: z.string().max(200).trim().optional(),
  region: z.string().max(100).trim().optional(),
});

export const UpdateShopSchema = CreateShopSchema.partial().extend({
  logo: z.string().url().optional(),
});

export const ShopsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const ShopProductsQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "popular"])
    .default("newest"),
});

export type CreateShopDto = z.infer<typeof CreateShopSchema>;
export type UpdateShopDto = z.infer<typeof UpdateShopSchema>;
export type ShopsListQuery = z.infer<typeof ShopsListQuerySchema>;
export type ShopProductsQuery = z.infer<typeof ShopProductsQuerySchema>;
