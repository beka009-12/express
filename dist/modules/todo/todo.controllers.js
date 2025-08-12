"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data = [];
const getAllTodo = async (req, res) => {
    try {
        res.status(200).send({
            success: true,
            data: data,
        });
    }
    catch (e) {
        console.error(`Error in getAllTodo: ${e}`);
        res.status(500).send({
            success: false,
            message: `Error in getAllTodo: ${e}`,
        });
    }
};
const addTodo = async (req, res) => {
    try {
        const { title, description, name, age, image } = req.body;
        if (!title) {
            res.status(400).send({
                success: false,
                message: "Title is required",
            });
            return;
        }
        const newTodo = {
            id: data.length + 1,
            title,
            age: age || 0,
            name: name || "Anonymous",
            image: image ||
                "https://t3.ftcdn.net/jpg/04/60/01/36/360_F_460013622_6xF8uN6ubMvLx0tAJECBHfKPoNOR5cRa.jpg",
            description: description || "",
        };
        data.push(newTodo);
        res.status(201).send({
            success: true,
            data: newTodo,
        });
    }
    catch (e) {
        console.error(`Error in addTodo: ${e}`);
        res.status(500).send({
            success: false,
            message: `Error in addTodo: ${e}`,
        });
    }
};
const deletetodo = async (req, res) => {
    try {
        const { id } = req.params;
        const todoIndex = data.findIndex((todo) => todo.id === +id);
        if (todoIndex === -1) {
            res.status(404).send({
                success: false,
                message: "Todo not found",
            });
            return;
        }
        data.splice(todoIndex, 1);
        res.status(200).send({
            success: true,
            message: "Todo successfully",
            data: {
                id,
            },
        });
    }
    catch (e) {
        console.log(e);
    }
};
const updateTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, name, age, image } = req.body;
        const todoIndex = data.findIndex((todo) => todo.id === +id);
        if (todoIndex === -1) {
            res.status(404).send({
                success: false,
                message: "Todo not found",
            });
            return;
        }
        if (title !== undefined)
            data[todoIndex].title = title;
        if (description !== undefined)
            data[todoIndex].description = description;
        if (name !== undefined)
            data[todoIndex].name = name;
        if (age !== undefined)
            data[todoIndex].age = age;
        if (image !== undefined)
            data[todoIndex].image = image;
        res.status(200).send({
            success: true,
            data: data[todoIndex],
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error updating todo",
        });
    }
};
exports.default = {
    getAllTodo,
    addTodo,
    deletetodo,
    updateTodo,
};
