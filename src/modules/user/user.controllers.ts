import { Request, Response } from "express";
import prisma from "../../plugin/prisma";

const signUpUser = async (req: Request, res: Response) => {
  const { fullName, login, password } = req.body;
  try {
    const data = await prisma.user.create({
      data: {
        fullName: req.body.fullName || "Default Name",
        login: req.body.login || "Default Login",
        password: req.body.password || "Default Password",
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
    return;
  }
};

const signInUser = async (req: Request, res: Response) => {
  const { login, password, fullName } = req.body;
  try {
    if (!login || !password || !fullName) {
      return res.status(401).send({
        success: false,
        message: "Login and password are required",
      });
    }
    const user = await prisma.user.findFirst({
      where: {
        login,
        password,
        fullName,
      },
    });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).send({
      success: true,
      data: user,
    });
  } catch (e) {
    console.error(`error in signInUser: ${e}`);
    res.status(500).send({
      success: false,
      message: `Error in signInUser: ${e}`,
    });
  }
};

const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await prisma.user.findFirst({
      where: {
        id: +id,
      },
    });

    if (!data) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).send({
      success: true,
      data,
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message: `error in getUserById: ${e}`,
    });
  }
};

const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fullName } = req.body;

  try {
    const data = await prisma.user.update({
      where: { id: +id },
      data: { fullName },
    });

    res.status(200).send({
      success: true,
      data,
    });
  } catch (e) {
    console.error(`error in updateUser: ${e}`);

    res.status(500).send({
      success: false,
      message: `Error in updateUser: ${e}`,
    });
  }
};

export default {
  getUserById,
  signUpUser,
  signInUser,
  updateUser,
};
