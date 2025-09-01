import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    // 1. Проверка заполненности
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Заполните все обязательные поля" });
    }

    // 2. Проверяем, есть ли пользователь
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Такой email уже зарегистрирован" });
    }

    // 3. Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Создаём пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: "USER",
      },
    });

    // 5. Создаём JWT токен
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "7d" }
    );

    // 6. Отдаём результат
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

export default { register };
