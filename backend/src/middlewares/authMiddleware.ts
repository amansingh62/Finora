import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens.js";

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({
      message: "Access token is missing",
    });
  }

  try {
    const payload = verifyAccessToken(accessToken);

    if (!payload) return res.status(401).json({ message: "Unauthorized" });

    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or Expired Token" });
  }
};