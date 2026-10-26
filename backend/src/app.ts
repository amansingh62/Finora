import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/authRoutes.js";
import walletRoutes from "./modules/wallet/walletRoutes.js";
import depositRoutes from "./modules/deposit/depositRoutes.js";
import bankRoutes from "./modules/banks/bankRoutes.js";

import { env } from "./config/env.js";
import { prisma } from "../lib/prisma.js";

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
app.use("/api/bank", bankRoutes);

app.get("/api/health/transaction", async (_req, res) => {
  const startedAt = Date.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      return await tx.$queryRaw`SELECT 1 AS result`;
    });

    return res.status(200).json({
      transaction: "success",
      result,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("Transaction health check failed:", error);

    return res.status(500).json({
      transaction: "failed",
      durationMs: Date.now() - startedAt,
    });
  }
});

export default app;