import { config } from "dotenv";
config();

import express from "express";
import routes from "./routes";

export const buildServer = () => {
  const info = [
    {
      description: "Sample app with Express, TypeScript, Prisma & JWT",
    },
  ];

  const server = express();

  server.use(express.json());

  server.get("/", (req, res) => {
    res.status(200).send({ message: info });
  });

  server.use("/api/v1", routes); // подключаем маршруты

  return server;
};
