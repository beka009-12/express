import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { authService } from "./auth.service";

const signUpUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({
        message:
          "Заполните все обязательные поля: email, password, name, phone",
      });
    }

    const result = await authService.register(
      email,
      password,
      name,
      phone,
      "USER",
    );

    return res.status(201).json({
      message: result.message,
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    console.error("Ошибка регистрации:", error);

    if (error.message.includes("уже существует")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const signUpSeller = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({
        message:
          "Заполните все обязательные поля: email, password, name, phone",
      });
    }

    const result = await authService.register(
      email,
      password,
      name,
      phone,
      "OWNER",
    );

    return res.status(201).json({
      message: result.message,
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    console.error("Ошибка регистрации продавца:", error);

    if (error.message.includes("уже существует")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Заполните все обязательные поля: email, password",
      });
    }

    const result = await authService.login(email, password);

    return res.status(200).json({
      result,
    });
  } catch (error: any) {
    console.error("Ошибка входа:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Не авторизован" });

    return res.status(200).json({ message: "Выход успешен" });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { signUpUser, signUpSeller, login, logout };
