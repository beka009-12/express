import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
  role: "OWNER" | "USER";
}

export const authMiddleware = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Нет токена" });

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Нет доступа" });
      }

      (req as any).user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Невалидный токен" });
    }
  };
};
