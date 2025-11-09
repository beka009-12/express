import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

// 🔹 Генерация токенов
const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" } // короткий срок жизни access токена
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// 🔹 Регистрация продавца
const signUpSeller = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Пользователь уже существует" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "OWNER",
      },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    // сохраняем refresh токен в базе
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    // сохраняем в cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    return res.status(201).json({
      message: "Продавец зарегистрирован",
      user,
      accessToken,
    });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 🔹 Вход продавца
const signInSeller = async (req: Request, res: Response) => {
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

    // сохраняем refresh токен в базе
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Ошибка логина:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 🔹 Обновление токена (refresh)
const refreshTokenSeller = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "Нет refresh токена" });

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored)
      return res.status(403).json({ message: "Неверный refresh токен" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });

    const { accessToken, refreshToken: newRefresh } = generateTokens(user);

    // ротация refresh токена
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

// 🔹 Профиль продавца
const getProfileSeller = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Не авторизован" });
    if (req.user.role !== "OWNER")
      return res.status(403).json({ message: "Доступ запрещён" });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { stores: true },
    });

    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Ошибка получения профиля:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 🔹 Создание магазина
const createStore = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Не авторизован" });

    if (req.user?.role !== "OWNER")
      return res.status(403).json({ message: "Доступ запрещён" });

    const existingStore = await prisma.store.findFirst({
      where: { ownerId: userId },
    });

    if (existingStore)
      return res.status(400).json({ message: "У вас уже есть магазин" });

    const { name, description, logo, address, region } = req.body;

    if (!name)
      return res.status(400).json({ message: "У магазина должно быть имя" });

    const store = await prisma.store.create({
      data: {
        name,
        description,
        logo,
        address,
        region,
        ownerId: userId,
      },
    });

    return res.status(201).json({
      message: "Магазин успешно создан",
      store,
    });
  } catch (error) {
    console.error("Ошибка создания магазина:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 🔹 Выход (logout)
const logoutSeller = async (req: Request, res: Response) => {
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

export {
  signUpSeller,
  signInSeller,
  getProfileSeller,
  createStore,
  refreshTokenSeller,
  logoutSeller,
};
