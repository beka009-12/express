import { Request, Response } from "express";
import prisma from "../../plugin/prisma";

const getUser = async (req: Request, res: Response) => {
  const { id } = req.query;
  try {
    const data = await prisma.user.findMany({
      where: {
        id: id ? +id : undefined,
      },
    });

    res.status(200).send({
      success: true,
      data,
    });
  } catch (e) {
    console.error(`error in getUser: ${e}`);
    res.status(500).send({
      success: false,
      message: `Error in getUser: ${e}`,
    });
  }
};

const userCreate = async (req: Request, res: Response) => {
  const { fullName } = req.body;
  try {
    const data = await prisma.user.create({
      data: {
        fullName: req.body.fullName || "Default Name",
      },
    });

    res.status(200).send({
      success: true,
      data,
    });
  } catch (e) {
    console.error(`error in userCreate: ${e}`);
    res.status(500).send({
      success: false,
      message: `Error in userCreate: ${e}`,
    });
  }
};

export default {
  getUser,
  userCreate,
};
