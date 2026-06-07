import { Request, Response, NextFunction } from "express";
import { redis } from "../plugin/redis";

export const cacheMiddleware = (ttl: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (err) {
      console.error("[Redis] cache read error:", err);
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (res.statusCode === 200) {
        redis.setex(key, ttl, JSON.stringify(body)).catch((err) => {
          console.error("[Redis] cache write error:", err);
        });
      }
      return originalJson(body);
    }) as Response["json"];

    return next();
  };
};
