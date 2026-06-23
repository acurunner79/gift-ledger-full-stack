import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../utils/jwt.js";

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
  };
};

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Missing or invalid authorization header"
    });
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = verifyAuthToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email
    };

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}