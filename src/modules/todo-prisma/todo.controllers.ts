import { Request, Response } from "express";
import prisma from "../../plugin/prisma";

const getTodos = async (req: Request, res: Response) => {
  try {
    const data = await prisma.todo.findMany();

    res.status(200).send({
      status: "success",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const createTodo = async (req: Request, res: Response) => {
  try {
    const { title, description, image, name, age, email } = req.body;
    const data = await prisma.todo.create({
      data: {
        image:
          req.body.image ||
          "https://t3.ftcdn.net/jpg/04/60/01/36/360_F_460013622_6xF8uN6ubMvLx0tAJECBHfKPoNOR5cRa.jpg",
        description: req.body.description || "",
        title: req.body.title || "No title",
        email: email || "",
        name: name || "Anonymous",
        age: age || 0,
      },
    });
    res.status(201).send({
      status: "success",
      data: data,
    });
  } catch (error) {
    console.error(`Error in createTodo: ${error}`);
    res.status(500).send({
      success: false,
      message: `Error in createTodo status 500: ${error}`,
    });
  }
};

export default { getTodos, createTodo };
