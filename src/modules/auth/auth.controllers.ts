import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name)
      return res.status(400).json({ message: "Заполните все поля" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email уже зарегистрирован" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: "USER" },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Регистрация успешна",
      user,
      accessToken,
    });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email и пароль обязательны" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(401).json({ message: "Неверный email или пароль" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Неверный email или пароль" });

    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Вход успешен",
      user,
      accessToken,
    });
  } catch (error) {
    console.error("Ошибка логина:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        cart: true, // массив корзины
        favorites: true, // массив избранного
        orders: true, // массив заказов
      },
    });

    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Ошибка получения профиля:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const logout = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
      res.clearCookie("refreshToken");
    }
    return res.json({ message: "Выход успешен" });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка выхода" });
  }
};
const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });

    const { name, phone, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, phone, avatar },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
      },
    });

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка при обновлении профиля" });
  }
};

const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "Нет refresh токена" });

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!storedToken)
      return res.status(403).json({ message: "Неверный refresh токен" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });

    const { accessToken, refreshToken: newRefresh } = generateTokens(user);

    await prisma.refreshToken.update({
      where: { token },
      data: { token: newRefresh },
    });

    res.cookie("refreshToken", newRefresh, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken });
  } catch (error) {
    console.error("Ошибка refresh:", error);
    return res
      .status(403)
      .json({ message: "Невалидный или просроченный refresh токен" });
  }
};

export { register, login, getProfile, logout, updateProfile, refresh };
