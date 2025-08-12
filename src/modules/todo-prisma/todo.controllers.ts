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

export default { getTodos };
