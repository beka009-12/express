import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../prisma";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

type UserRole = "USER" | "OWNER";
class AuthService {
  // ? ✅ Регистрация
  async register(
    email: string,
    password: string,
    name: string,
    phone: string,
    role: UserRole,
  ) {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new Error("Пользователь с таким email уже существует");
    }

    const hashedPassowrd = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassowrd,
        name,
        phone,
        role,
      },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, jti: uuidv4() },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    const userWithToken = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      token,
    };

    return {
      message: "Регистрация прошла успешно",
      user: userWithToken,
      token,
    };
  }

  // ? ✅ Авторизация
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        role: true,
        password: true,
      },
    });

    if (!user) {
      throw new Error("Неверный email или пароль");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error("Неверный email или пароль");
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        jti: uuidv4(),
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
    };

    return {
      message: "Вход успешен",
      user: safeUser,
      token,
    };
  }

  async googleAuth(idToken: string, role: "USER" | "OWNER") {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new Error("INVALID_GOOGLE_TOKEN");

    const { sub: googleId, email, name, picture } = payload;

    // Уже есть аккаунт через Google
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      // Есть аккаунт через email — привязываем Google
      user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      } else {
        // Новый пользователь
        user = await prisma.user.create({
          data: {
            email,
            password: "",
            name: name ?? null,
            avatar: picture ?? null,
            googleId,
            role,
          },
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, jti: uuidv4() },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    return {
      message: "Вход через Google выполнен",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      token,
    };
  }
}

export const authService = new AuthService();

