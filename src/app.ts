import express from "express";
import cors from "cors";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

export const buildServer = () => {
  const server = express();

  server.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://shop-green-nu.vercel.app",
      ],
      credentials: true,
    }),
  );

  server.use(express.json());

  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Nest Shop API",
        version: "1.0.0",
        description: "API for my startup",
      },
      servers: [{ url: "http://localhost:5003" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    apis: [
      `${process.cwd()}/src/modules/**/*.routes.ts`,
      `${process.cwd()}/src/routes/*.ts`,
    ],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  server.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  server.get("/docs-json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  server.get("/", (req, res) => {
    res.status(200).send({ message: "API is working" });
  });

  server.use("/nest-shop", routes);

  return server;
};
