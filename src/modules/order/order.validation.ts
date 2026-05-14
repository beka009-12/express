import { z } from "zod";

export const CreateOrderDto = z.object({
  deliveryMethod: z.enum([
    "PICKUP",
    "COURIER_BISHKEK",
    "COURIER_REGION",
    "EXPRESS",
  ]),

  addressId: z.number().optional(),
  paymentMethod: z.string().optional().default("CARD"),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDto>;
