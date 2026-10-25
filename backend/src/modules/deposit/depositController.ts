import type { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";
import {
  DepositStatus,
  WalletStatus,
} from "../../../generated/prisma/enums.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { processDepositService } from "./depositService.js";

export const deposit = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { amount } = req.body;

    const idempotencyKey = req.get("Idempotency-Key")?.trim();

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!idempotencyKey) {
      return res.status(400).json({
        message: "Idempotency key is required",
      });
    }

    const isValidAmountType =
      typeof amount === "number" || typeof amount === "string";

    const isWholeNumber =
      typeof amount === "number"
        ? Number.isSafeInteger(amount)
        : typeof amount === "string" && /^\d+$/.test(amount);

    if (!isValidAmountType || !isWholeNumber) {
      return res.status(400).json({
        message: "Amount must be a positive whole number",
      });
    }

    const numericAmount = Number(amount);

    if (
      !Number.isSafeInteger(numericAmount) ||
      numericAmount <= 0 ||
      numericAmount > 1_000_000
    ) {
      return res.status(400).json({
        message: "Amount must be greater than zero and at most 1000000",
      });
    }

    const depositAmount = new Prisma.Decimal(numericAmount);

    const existingDeposit = await prisma.deposit.findUnique({
      where: {
        idempotencyKey,
      },
      include: {
        wallet: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (existingDeposit) {
      if (existingDeposit.wallet.userId !== userId) {
        return res.status(409).json({
          message: "Idempotency key has already been used",
        });
      }

      if (!existingDeposit.amount.equals(depositAmount)) {
        return res.status(409).json({
          message: "Idempotency key was used with a different amount",
        });
      }

      if (
        existingDeposit.status !== DepositStatus.PENDING &&
        existingDeposit.status !== DepositStatus.SUCCESS
      ) {
        return res.status(409).json({
          message: "Deposit cannot be processed from its current status",
          status: existingDeposit.status,
        });
      }

      const result = await processDepositService(
        existingDeposit.id,
        userId
      );

      const isSuccessful =
        result.deposit.status === DepositStatus.SUCCESS;

      return res.status(200).json({
        message: result.alreadyProcessed
          ? "Deposit has already been processed"
          : isSuccessful
            ? "Deposit processed successfully"
            : "Deposit is still pending",
        deposit: {
          id: result.deposit.id,
          amount: result.deposit.amount.toString(),
          status: result.deposit.status,
          referenceId: result.deposit.referenceId,
          transactionId: result.deposit.transactionId,
        },
        walletBalance: result.balance.toString(),
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    if (wallet.status !== WalletStatus.ACTIVE) {
      return res.status(403).json({
        message: "Wallet is frozen or inactive",
      });
    }

    const newDeposit = await prisma.deposit.create({
      data: {
        amount: depositAmount,
        walletId: wallet.id,
        idempotencyKey,
        status: DepositStatus.PENDING,
      },
      select: {
        id: true,
      },
    });

    const result = await processDepositService(newDeposit.id, userId);

    const isSuccessful =
      result.deposit.status === DepositStatus.SUCCESS;

    return res.status(201).json({
      message: isSuccessful
        ? "Deposit processed successfully"
        : "Deposit is still pending",
      deposit: {
        id: result.deposit.id,
        amount: result.deposit.amount.toString(),
        status: result.deposit.status,
        referenceId: result.deposit.referenceId,
        transactionId: result.deposit.transactionId,
      },
      walletBalance: result.balance.toString(),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        message: "Duplicate deposit request",
      });
    }

    console.error("Error processing deposit:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getDeposits = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const deposits = await prisma.deposit.findMany({
      where: {
        wallet: {
          userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        amount: true,
        status: true,
        referenceId: true,
        requestedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    if (deposits.length === 0) {
      return res.status(200).json({
        message: "No deposit history found",
        deposits: [],
      });
    }

    return res.status(200).json({
      message: "Deposits fetched successfully",
      deposits: deposits.map((deposit) => ({
        ...deposit,
        amount: deposit.amount.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching deposits:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getDeposit = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { depositId } = req.params as { depositId: string };

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!depositId?.trim()) {
      return res.status(400).json({
        message: "Deposit ID is required",
      });
    }

    const deposit = await prisma.deposit.findFirst({
      where: {
        id: depositId,
        wallet: {
          userId,
        },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        referenceId: true,
        requestedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    if (!deposit) {
      return res.status(404).json({
        message: "Deposit not found",
      });
    }

    return res.status(200).json({
      message: "Deposit fetched successfully",
      deposit: {
        ...deposit,
        amount: deposit.amount.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching deposit:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
