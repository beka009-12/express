"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyStore = exports.uploadStoreLogo = exports.logautSeller = exports.createStore = exports.signInSeller = exports.getProfileSaller = exports.signUpSeller = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const supabase_1 = require("../../plugin/supabase");
const prisma_1 = require("../../prisma");
// todo signUpSeller
const signUpSeller = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Пользователь уже существует" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: "OWNER",
            },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, jti: (0, uuid_1.v4)() }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({
            message: "Продавец зарегистрирован",
            user,
            token,
            data: req.body,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Ошибка сервера" });
    }
};
exports.signUpSeller = signUpSeller;
// todo signInSeller
const signInSeller = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Email и пароль обязательны" });
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ message: "Неверный email или пароль" });
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ message: "Неверный email или пароль" });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, jti: (0, uuid_1.v4)() }, process.env.JWT_SECRET, { expiresIn: "7d" });
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
exports.signInSeller = signInSeller;
// todo getProfileSaller
const getProfileSaller = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Не авторизован" });
        if (req.user.role !== "OWNER")
            return res.status(403).json({ message: "Доступ запрещён" });
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: { stores: true },
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
exports.getProfileSaller = getProfileSaller;
const logautSeller = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Не авторизован" });
        return res.status(200).json({ message: "Выход успешен" });
    }
    catch (error) {
        return res.status(500).json({ message: "Ошибка сервера" });
    }
};
exports.logautSeller = logautSeller;
// ! store
const createStore = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Не авторизован" });
        }
        if (req.user?.role !== "OWNER") {
            return res.status(403).json({
                message: "У вас нет прав создавать магазин",
            });
        }
        const existingStore = await prisma_1.prisma.store.findFirst({
            where: { ownerId: userId },
        });
        if (existingStore) {
            return res.status(400).json({ message: "У вас уже есть магазин" });
        }
        const { name, description, logo, address, region } = req.body;
        if (!name) {
            return res.status(400).json({ message: "У магазина должно быть имя" });
        }
        const store = await prisma_1.prisma.store.create({
            data: {
                name,
                description,
                logo, // ←  сюда прилетает URL из store-logos
                address,
                region,
                ownerId: userId,
            },
        });
        return res.status(201).json({
            message: "Магазин успешно создан",
            store,
        });
    }
    catch (error) {
        console.error("Ошибка создания магазина:", error);
        return res.status(500).json({ message: "Ошибка сервера" });
    }
};
exports.createStore = createStore;
const uploadStoreLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const ext = req.file.originalname.split(".").pop();
        const fileName = `${Date.now()}-${(0, uuid_1.v4)()}.${ext}`;
        const { data, error } = await supabase_1.supabase.storage
            .from("store-logos") // ← НОВЫЙ bucket
            .upload(`uploads/${fileName}`, req.file.buffer, {
            contentType: req.file.mimetype,
        });
        if (error)
            throw error;
        res.status(200).json({
            name: fileName,
            url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${data.path}`,
        });
    }
    catch (error) {
        res.status(500).json({
            message: `Error uploading store logo`,
            error: error.message,
        });
    }
};
exports.uploadStoreLogo = uploadStoreLogo;
const getMyStore = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Не авторизован" });
        const store = await prisma_1.prisma.store.findUnique({ where: { ownerId: userId } });
        if (!store)
            return res.status(404).json({ message: "Магазин не найден" });
        return res.status(200).json({ store });
    }
    catch (error) {
        return res.status(500).json({ message: "Ошибка сервера" });
    }
};
exports.getMyStore = getMyStore;
