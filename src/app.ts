import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import routes from "./routes";

export const buildServer = () => {
  const info = [
    {
      description: "Sample app with Express, TypeScript, Prisma & JWT",
    },
  ];

  const server = express();

  // === ГЛОБАЛЬНЫЙ CORS ===
  server.use(
    cors({
      origin: ["http://localhost:3000", "https://shop-indol-alpha.vercel.app"],
      credentials: true,
    })
  );

  server.use(express.json());

  // Тестовый корневой роут
  server.get("/", (_req: Request, res: Response) => {
    res.status(200).send({ message: info });
  });

  // Подключаем роуты /api/v1
  server.use("/api/v1", routes);

  // === ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК ===
  server.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
  });

  return server;
};
