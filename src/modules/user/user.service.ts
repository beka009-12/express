import { prisma } from "../../prisma";

export const UserService = {
  // ! Получение профиля
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        favorites: true,
        cartItems: true,
      },
      omit: { password: true }, // ? скрываем пароль
    });

    return user;
  },

  // ! Обновление профиля
  async updateProfile(userId: number, data: any) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        avatar: data.avatar,
        email: data.email,
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

    return updatedUser;
  },
};
