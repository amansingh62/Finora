import type { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";

export const getWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        cashBalance: true,
        usedMargin: true,
        reservedWithdrawals: true,
        status: true,
      },
    });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    return res.status(200).json({
      message: "Wallet fetched successfully",
      wallet,
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const summary = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        cashBalance: true,
        usedMargin: true,
        reservedWithdrawals: true,
      },
    });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    const availableBalance = wallet.cashBalance
      .minus(wallet.usedMargin)
      .minus(wallet.reservedWithdrawals);

    return res.status(200).json({
      message: "Available balance fetched successfully",
      availableBalance: availableBalance.toString(),
    });
    
  } catch (error) {
    console.error("Error fetching wallet summary:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

