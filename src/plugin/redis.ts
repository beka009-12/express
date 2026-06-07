import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error("REDIS_URL is not set in environment variables");
}

export const redis = new Redis(REDIS_URL);

redis.on("connect", () => console.log("[Redis] connected"));
redis.on("error", (err) => console.error("[Redis] error:", err));
