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

// todo signUpSeller
const signUpSeller = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "OWNER",
      },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, jti: uuidv4() },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Продавец зарегистрирован",
      user,
      token,
      data: req.body,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// todo signInSeller
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

    const token = jwt.sign(
      { id: user.id, role: user.role, jti: uuidv4() },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Вход успешен",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Ошибка логина:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

// todo getProfileSaller
const getProfileSaller = async (req: AuthRequest, res: Response) => {
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

// ! store
const createStore = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    if (req.user?.role !== "OWNER") {
      return res.status(403).json({ message: "Доступ запрещён" });
    }

    const existingStore = await prisma.store.findFirst({
      where: { ownerId: userId },
    });

    if (existingStore) {
      return res.status(400).json({ message: "У вас уже есть магазин" });
    }

    const { name, description, logo, address, region } = req.body;

    if (!name) {
      return res.status(400).json({ message: "У магазина должно быть имя" });
    }

    // Создание нового магазина
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

export { signUpSeller, getProfileSaller, signInSeller, createStore };
