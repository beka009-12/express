import { Request, Response } from "express";
import prisma from "../../plugin/prisma";

const getTodos = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const data = await prisma.todo.findMany({
      where: {
        id: id ? +id : undefined,
      },
    });

    res.status(200).send({
      success: true,
      data,
    });
  } catch (e) {
    console.error(`error in getTodos: ${e}`);

    res.status(500).send({
      success: false,
      message: `Error in getTodos: ${e}`,
    });
  }
};

const getTodoByID = async (req: Request, res: Response) => {
  try {
    const data = await prisma.todo.findFirst();

    // 1
    res.status(200).send({
      success: true,
      data,
    });
  } catch (e) {
    console.error(`error in getTodos: ${e}`);

    res.status(500).send({
      success: false,
      message: `Error in getTodos: ${e}`,
    });
  }
};

const createTodo = async (req: Request, res: Response) => {
  const { title, description } = req.body;
  try {
    const data = await prisma.todo.create({
      data: {
        userId: 1,
        title: req.body.title || "Default Title",
        description: req.body.description || "",
      },
    });
    res.status(200).send({
      success: true,
      data,
    });
  } catch (e) {
    console.error(`error in createTodo: ${e}`);
    res.status(500).send({
      success: false,
      message: `Error in createTodo: ${e}`,
    });
  }
};

const deleteTodo = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = await prisma.todo.delete({
      where: {
        id: +id,
      },
    });

    res.status(200).send({
      success: true,
      data,
    });
  } catch (e) {
    console.error(`error in deleteTodo: ${e}`);
    res.status(500).send({
      success: false,
      message: `Error in deleteTodo: ${e}`,
    });
  }
};

const updateTodo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, image, email, age, description, name } = req.body;

  try {
    const data = await prisma.todo.update({
      where: {
        id: +id,
      },
      data: {
        title,
        description,
      },
    });

    res.status(200).send({
      success: true,
      data,
    });
  } catch (e) {
    console.error(`error in updateTodo: ${e}`);
    res.status(500).send({
      success: false,
      message: `Error in updateTodo: ${e}`,
    });
  }
};

export default { getTodos, createTodo, deleteTodo, getTodoByID, updateTodo };
