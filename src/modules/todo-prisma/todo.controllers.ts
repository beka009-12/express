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
    const data = await prisma.todo.create({
      data: {
        image: "",
        description: "",
        title: "",
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
