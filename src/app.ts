import { config } from "dotenv";
config();
import express from "express";
import routes from "./routes";

export const buildServer = () => {
  const info = [
    {
      title: "Hello world",
      name: "John Doe",
      age: 30,
      description:
        "This is a sample application built with Express and TypeScript.",
    },
  ];

  const server = express();

  // Middleware
  server.use(express.json());

  server.get("/", (req, res) => {
    res.status(200).send({
      message: info,
    });
  });

  server.use("/api/v1", routes);

  return server;
};
