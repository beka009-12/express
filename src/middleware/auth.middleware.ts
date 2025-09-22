import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: number;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Не авторизован" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Не авторизован" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_key"
    ) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Не авторизован" });
  }
};
