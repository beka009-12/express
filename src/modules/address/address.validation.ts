import { z } from "zod";

export const CreateAddressDto = z.object({
  label: z.string().min(1).max(50),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Некорректный номер телефона"),
  address: z.string().min(5).max(255),
  city: z.string().min(2).max(100).default("Бишкек"),
  region: z.string().max(100).optional().nullable(),
  isDefault: z.boolean().optional().default(false),
});

export type CreateAddressDto = z.infer<typeof CreateAddressDto>;

export const UpdateAddressDto = CreateAddressDto.partial();
export type UpdateAddressDto = z.infer<typeof UpdateAddressDto>;
