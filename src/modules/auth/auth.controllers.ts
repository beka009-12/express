import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signUpUser = async (req: Request, res: Response) => {
  const { email, password, name, adminKey } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Email, пароль и имя обязательны" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Назначаем роль
    const role: UserRole =
      adminKey === process.env.ADMIN_SECRET ? UserRole.ADMIN : UserRole.USER;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

const signInUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email и пароль обязательны" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password)
    return res.status(401).json({ message: "Неверный email или пароль" });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    return res.status(401).json({ message: "Неверный email или пароль" });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  res.json({ user, token });
};

const googleAuth = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token)
    return res.status(400).json({ message: "Google token обязателен" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email)
      return res.status(400).json({ message: "Невалидный токен" });

    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || "No Name",
          avatar: payload.picture,
          role: "USER",
        },
      });
    }

    const appToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    res.json({ user, token: appToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера при Google авторизации" });
  }
};

export default { signUpUser, signInUser, googleAuth };
