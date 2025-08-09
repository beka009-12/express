import { Request, Response } from "express";

const data: any[] = [];

const getAllTodo = async (req: Request, res: Response) => {
  try {
    res.status(200).send({
      success: true,
      data: data,
    });
  } catch (e) {
    console.error(`Error in getAllTodo: ${e}`);
    res.status(500).send({
      success: false,
      message: `Error in getAllTodo: ${e}`,
    });
  }
};

const addTodo = async (req: Request, res: Response) => {
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
      image:
        image ||
        "https://t3.ftcdn.net/jpg/04/60/01/36/360_F_460013622_6xF8uN6ubMvLx0tAJECBHfKPoNOR5cRa.jpg",
      description: description || "",
      completed: false,
    };
    data.push(newTodo);
    res.status(201).send({
      success: true,
      data: newTodo,
    });
  } catch (e) {
    console.error(`Error in addTodo: ${e}`);
    res.status(500).send({
      success: false,
      message: `Error in addTodo: ${e}`,
    });
  }
};

const deletetodo = async (req: Request, res: Response) => {
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
  } catch (e) {
    console.log(e);
  }
};

const updateTodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, name, age, iamge, completed } = req.body;

    const todoIndex = data.findIndex((todo) => todo.id === +id);
    if (todoIndex === -1) {
      res.status(404).send({
        success: false,
        message: "Todo not found",
      });
      return;
    }

    if (title !== undefined) data[todoIndex].title = title;
    if (description !== undefined) data[todoIndex].description = description;
    if (name !== undefined) data[todoIndex].name = name;
    if (age !== undefined) data[todoIndex].age = age;
    if (completed !== undefined) data[todoIndex].completed = completed;
    if (iamge !== undefined) data[todoIndex].image = iamge;
    res.status(200).send({
      success: true,
      message: "Todo updated successfully",
      data: data[todoIndex],
    });
  } catch (e) {
    console.error(`Error in updateTodo: ${e}`);
    res.status(500).send({
      success: false,
      message: `Error in updateTodo: ${e}`,
    });
  }
};

export default {
  getAllTodo,
  addTodo,
  deletetodo,
  updateTodo,
};
