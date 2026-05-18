import { prisma } from "../../prisma";

interface UpdateProfileDto {
  name?: string;
  phone?: string;
  avatar?: string;
  email?: string;
}

export const UserService = {
  async getProfile(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
      include: {
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
        favorites: {
          include: {
            product: {
              select: { id: true, title: true, price: true, newPrice: true, productImages: { take: 1, orderBy: { sortOrder: "asc" } } },
            },
          },
        },
        cartItems: {
          include: {
            product: {
              select: { id: true, title: true, price: true, newPrice: true, stockCount: true, productImages: { take: 1, orderBy: { sortOrder: "asc" } } },
            },
          },
        },
      },
    });
  },

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.email !== undefined && { email: dto.email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });
  },
};
