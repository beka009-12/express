import { buildServer } from "./app";

const server = buildServer();

const start = async () => {
  const PORT = process.env.PORT || 5000; // Railway подставит свой PORT
  try {
    server.listen(
      {
        port: Number(PORT),
        host: "0.0.0.0",
      },
      () => {
        console.log(`${new Date()}`);
        console.log("Server running at: http://localhost:" + PORT);
      }
    );
  } catch (error) {
    console.error(error);
  }
};

start();
