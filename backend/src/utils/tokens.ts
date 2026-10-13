import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { TokenPayload } from "../types/jwtTypes.js";

export const signAccessToken = (userId: string) => {
 return jwt.sign({ userId }, env.ACCESS_SECRET, { expiresIn: "15m"})
};

export const signRefreshToken = (userId: string) => {
 return jwt.sign({ userId }, env.REFRESH_SECRET, { expiresIn: "7d"})
};

export const verifyAccessToken = (token: string) => {
  return  jwt.verify(token, env.ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, env.REFRESH_SECRET) as TokenPayload;
};