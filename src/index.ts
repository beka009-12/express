import { buildServer } from "./app";
import { config } from "dotenv";
config();

const app = buildServer();

const PORT = Number(process.env.PORT) || 5002;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open: http://localhost:${PORT} (локально)`);
  console.log(`Railway URL: https://express-production-b873.up.railway.app`);
});
