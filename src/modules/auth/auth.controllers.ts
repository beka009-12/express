import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Интерфейс запроса с user
interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name)
      return res
        .status(400)
        .json({ message: "Заполните все обязательные поля" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "Такой email уже зарегистрирован" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: "USER" },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Регистрация успешна",
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

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "secret_key",
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

const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });

    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Ошибка получения профиля:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const Logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });

    return res.status(200).json({ message: "Выход успешен" });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { register, login, getProfile, Logout };
