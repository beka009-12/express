"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../plugin/prisma"));
const getTodos = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await prisma_1.default.todo.findMany({
            where: {
                id: id ? +id : undefined,
            },
        });
        res.status(200).send({
            success: true,
            data,
        });
    }
    catch (e) {
        console.error(`error in getTodos: ${e}`);
        res.status(500).send({
            success: false,
            message: `Error in getTodos: ${e}`,
        });
    }
};
const getTodoByID = async (req, res) => {
    try {
        const data = await prisma_1.default.todo.findFirst();
        // 1
        res.status(200).send({
            success: true,
            data,
        });
    }
    catch (e) {
        console.error(`error in getTodos: ${e}`);
        res.status(500).send({
            success: false,
            message: `Error in getTodos: ${e}`,
        });
    }
};
const createTodo = async (req, res) => {
    const { title, image, email, age, description, name } = req.body;
    try {
        const data = await prisma_1.default.todo.create({
            data: {
                title: req.body.title || "Default Title",
                image: req.body.image ||
                    "https://t3.ftcdn.net/jpg/04/60/01/36/360_F_460013622_6xF8uN6ubMvLx0tAJECBHfKPoNOR5cRa.jpg",
                age: req.body.age || 0,
                name: req.body.name || "Anonymous",
                description: req.body.description || "",
                email: req.body.email || "",
            },
        });
        res.status(200).send({
            success: true,
            data,
        });
    }
    catch (e) {
        console.error(`error in createTodo: ${e}`);
        res.status(500).send({
            success: false,
            message: `Error in createTodo: ${e}`,
        });
    }
};
const deleteTodo = async (req, res) => {
    const { id } = req.params;
    try {
        const data = await prisma_1.default.todo.delete({
            where: {
                id: +id,
            },
        });
        res.status(200).send({
            success: true,
            data,
        });
    }
    catch (e) {
        console.error(`error in deleteTodo: ${e}`);
        res.status(500).send({
            success: false,
            message: `Error in deleteTodo: ${e}`,
        });
    }
};
const updateTodo = async (req, res) => {
    const { id } = req.params;
    const { title, image, email, age, description, name } = req.body;
    try {
        const data = await prisma_1.default.todo.update({
            where: {
                id: +id,
            },
            data: {
                title,
                image,
                email,
                age,
                description,
                name,
            },
        });
        res.status(200).send({
            success: true,
            data,
        });
    }
    catch (e) {
        console.error(`error in updateTodo: ${e}`);
        res.status(500).send({
            success: false,
            message: `Error in updateTodo: ${e}`,
        });
    }
};
exports.default = { getTodos, createTodo, deleteTodo, getTodoByID, updateTodo };
