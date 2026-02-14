import { buildServer } from "./app";

const server = buildServer();

const start = async () => {
  try {
    const PORT = Number(process.env.PORT) || 5003;

    server.listen({
      port: PORT,
      host: "0.0.0.0",
    });

    console.log(`🚀 Server running on port ${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
