"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const register = async (req, res) => {
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
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name, role: "USER" },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "secret_key", { expiresIn: "7d" });
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
    }
    catch (error) {
        console.error("Ошибка регистрации:", error);
        return res.status(500).json({ message: "Ошибка сервера" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Email и пароль обязательны" });
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ message: "Неверный email или пароль" });
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ message: "Неверный email или пароль" });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "secret_key", { expiresIn: "7d" });
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
    }
    catch (error) {
        console.error("Ошибка логина:", error);
        return res.status(500).json({ message: "Ошибка сервера" });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Не авторизован" });
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, phone: true, role: true },
        });
        if (!user)
            return res.status(404).json({ message: "Пользователь не найден" });
        return res.status(200).json({ user });
    }
    catch (error) {
        console.error("Ошибка получения профиля:", error);
        return res.status(500).json({ message: "Ошибка сервера" });
    }
};
exports.getProfile = getProfile;
