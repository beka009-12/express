import { config } from "dotenv";
config();
import express from "express";
import routes from "./routes";

export const buildServer = () => {
  const server = express();

  // Middleware
  server.use(express.json());

  server.get("/", (req, res) => {
    res.status(200).send({
      message: "Hello, World!",
    });
  });

  server.use("/api/v1", routes);

  return server;
};
