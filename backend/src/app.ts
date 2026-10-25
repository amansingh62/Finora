import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/authRoutes.js";
import walletRoutes from "./modules/wallet/walletRoutes.js";
import depositRoutes from "./modules/deposit/depositRoutes.js";

import { env } from "./config/env.js";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/deposit", depositRoutes);

export default app;