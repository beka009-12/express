import { prisma } from "../../prisma";
import { CreateAddressDto, UpdateAddressDto } from "./address.validation";

class addressService {
  async createAddress(userId: number, dto: CreateAddressDto) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      const makeDefault = dto.isDefault || count === 0;

      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          label: dto.label,
          name: dto.name,
          phone: dto.phone,
          address: dto.address,
          city: dto.city,
          region: dto.region ?? null,
          isDefault: makeDefault,
        },
      });
    });
  }

  async getAddresses(userId: number) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async updateAddress(userId: number, addressId: number, dto: UpdateAddressDto) {
    return prisma.$transaction(async (tx) => {
      const address = await tx.address.findUnique({ where: { id: addressId } });

      if (!address) throw new Error("Адрес не найден");
      if (address.userId !== userId) throw new Error("Нет доступа");

      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.region !== undefined && { region: dto.region }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });
    });
  }

  async deleteAddress(userId: number, addressId: number) {
    return prisma.$transaction(async (tx) => {
      const address = await tx.address.findUnique({ where: { id: addressId } });

      if (!address) throw new Error("Адрес не найден");
      if (address.userId !== userId) throw new Error("Нет доступа");

      await tx.address.delete({ where: { id: addressId } });

      // Если удалён дефолтный — назначить следующий
      if (address.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }

      return { message: "Адрес удалён" };
    });
  }

  async setDefault(userId: number, addressId: number) {
    return prisma.$transaction(async (tx) => {
      const address = await tx.address.findUnique({ where: { id: addressId } });

      if (!address) throw new Error("Адрес не найден");
      if (address.userId !== userId) throw new Error("Нет доступа");

      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }
}

export const AddressService = new addressService();
