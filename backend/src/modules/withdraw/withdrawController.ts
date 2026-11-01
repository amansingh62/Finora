import type { Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/client.js";
import {
  WalletStatus,
  WithdrawalStatus,
} from "../../../generated/prisma/enums.js";

import { prisma } from "../../../lib/prisma.js";
import { processWithdrawalService } from "./withdrawalService.js";

export const withdrawMoney = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { amount: amountInput, bankAccountId } = req.body;

    const idempotencyKey = req.get("Idempotency-Key");

    // 1. Validate authentication.
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // 2. Validate idempotency key.
    if (
      !idempotencyKey ||
      idempotencyKey.trim().length === 0 ||
      idempotencyKey.length > 255
    ) {
      res.status(400).json({
        success: false,
        message: "A valid Idempotency-Key header is required",
      });
      return;
    }

    // 3. Validate bank account ID.
    if (
      typeof bankAccountId !== "string" ||
      bankAccountId.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "A valid bankAccountId is required",
      });
      return;
    }

    // 4. Validate the amount.
    if (
      (typeof amountInput !== "string" && typeof amountInput !== "number") ||
      String(amountInput).trim() === "" ||
      !/^\d+(\.\d{1,2})?$/.test(String(amountInput).trim())
    ) {
      res.status(400).json({
        success: false,
        message:
          "Amount must be a positive number with at most two decimal places",
      });
      return;
    }

    const amount = new Prisma.Decimal(String(amountInput).trim());

    if (amount.lessThanOrEqualTo(0) || amount.greaterThan(1_000_000)) {
      res.status(400).json({
        success: false,
        message: "Amount must be greater than zero and cannot exceed 1,000,000",
      });
      return;
    }

    // 5. Check whether this idempotency key was already used.
    const existingWithdrawal = await prisma.withdrawal.findUnique({
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

    if (existingWithdrawal) {
      // Do not allow another user to reuse this key.
      if (existingWithdrawal.wallet.userId !== userId) {
        res.status(409).json({
          success: false,
          message: "This idempotency key has already been used",
        });
        return;
      }

      // The same key must represent the same request.
      if (
        !existingWithdrawal.amount.equals(amount) ||
        existingWithdrawal.bankAccountId !== bankAccountId
      ) {
        res.status(409).json({
          success: false,
          message:
            "Idempotency key was already used with different withdrawal details",
        });
        return;
      }

      // Do not process a withdrawal already being processed.
      if (existingWithdrawal.status === WithdrawalStatus.PROCESSING) {
        res.status(409).json({
          success: false,
          message: "Withdrawal is already being processed",
          withdrawalId: existingWithdrawal.id,
          status: existingWithdrawal.status,
        });
        return;
      }

      // Return the existing successful withdrawal without processing again.
      if (existingWithdrawal.status === WithdrawalStatus.SUCCESS) {
        res.status(200).json({
          success: true,
          message: "Withdrawal has already been completed",
          withdrawal: existingWithdrawal,
          alreadyProcessed: true,
        });
        return;
      }

      // Only pending withdrawals can be processed by this service.
      if (existingWithdrawal.status !== WithdrawalStatus.PENDING) {
        res.status(409).json({
          success: false,
          message: "This withdrawal cannot be processed again",
          status: existingWithdrawal.status,
        });
        return;
      }

      const result = await processWithdrawalService(
        existingWithdrawal.id,
        userId,
      );

      res.status(200).json({
        success: true,
        message: "Withdrawal processed successfully",
        withdrawal: result.withdrawal,
        balance: result.balance.toString(),
        alreadyProcessed: result.alreadyProcessed,
      });
      return;
    }

    // 6. Verify that the destination bank account belongs to this user.
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId,
      },
      select: {
        id: true,
        bankName: true,
        accountHolder: true,
        accountNumber: true,
        ifscCode: true,
      },
    });

    if (!bankAccount) {
      res.status(404).json({
        success: false,
        message: "Bank account not found",
      });
      return;
    }

    // 7. Reserve wallet funds and create the pending withdrawal atomically.
    const withdrawal = await prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: {
            userId,
          },
          select: {
            id: true,
            status: true,
            cashBalance: true,
            usedMargin: true,
            reservedWithdrawals: true,
          },
        });

        if (!wallet) {
          throw new Error("WALLET_NOT_FOUND");
        }

        if (wallet.status !== WalletStatus.ACTIVE) {
          throw new Error("WALLET_INACTIVE");
        }

        // Available balance excludes funds used for margin
        // and funds already reserved for other withdrawals.
        const availableBalance = wallet.cashBalance
          .minus(wallet.usedMargin)
          .minus(wallet.reservedWithdrawals);

        if (availableBalance.lessThan(amount)) {
          throw new Error("INSUFFICIENT_AVAILABLE_BALANCE");
        }

        /*
         * Atomically reserve the requested amount.
         * The conditional update also protects against concurrent changes.
         */
        const reservation = await tx.wallet.updateMany({
          where: {
            id: wallet.id,
            userId,
            status: WalletStatus.ACTIVE,
            cashBalance: {
              gte: amount
                .plus(wallet.usedMargin)
                .plus(wallet.reservedWithdrawals),
            },
          },
          data: {
            reservedWithdrawals: {
              increment: amount,
            },
          },
        });

        if (reservation.count !== 1) {
          throw new Error("INSUFFICIENT_AVAILABLE_BALANCE");
        }

        // Create the withdrawal in PENDING state.
        return tx.withdrawal.create({
          data: {
            amount,
            reservedAmount: amount,
            status: WithdrawalStatus.PENDING,
            idempotencyKey,
            walletId: wallet.id,
            bankAccountId: bankAccount.id,
          },
          include: {
            bankAccount: {
              select: {
                id: true,
                bankName: true,
                accountHolder: true,
                accountNumber: true,
                ifscCode: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      },
    );

    // 8. Process the withdrawal after the reservation is committed.
    const result = await processWithdrawalService(withdrawal.id, userId);

    res.status(200).json({
      message: "Withdrawal processed successfully",
      withdrawal: result.withdrawal,
      balance: result.balance.toString(),
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // A duplicate idempotency key or other unique constraint violation.
      if (error.code === "P2002") {
        res.status(409).json({
          success: false,
          message:
            "A withdrawal with these unique details already exists. Check the existing withdrawal before retrying.",
        });
        return;
      }

      // Serializable transaction conflict.
      if (error.code === "P2034") {
        res.status(409).json({
          success: false,
          message:
            "A concurrent wallet operation occurred. Please retry the request using the same Idempotency-Key.",
        });
        return;
      }
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "WALLET_NOT_FOUND":
          res.status(404).json({
            success: false,
            message: "Wallet not found",
          });
          return;

        case "WALLET_INACTIVE":
          res.status(403).json({
            success: false,
            message: "Your wallet is frozen or inactive",
          });
          return;

        case "INSUFFICIENT_AVAILABLE_BALANCE":
          res.status(400).json({
            success: false,
            message: "Insufficient available wallet balance",
          });
          return;

        case "WITHDRAWAL_NOT_FOUND":
          res.status(404).json({
            success: false,
            message: "Withdrawal not found",
          });
          return;

        case "BANK_ACCOUNT_REQUIRED":
          res.status(400).json({
            success: false,
            message: "A destination bank account is required",
          });
          return;

        case "BANK_ACCOUNT_NOT_FOUND":
          res.status(404).json({
            success: false,
            message: "Bank account not found",
          });
          return;

        case "INVALID_WITHDRAWAL_STATUS":
          res.status(409).json({
            success: false,
            message: "Withdrawal is not in a processable state",
          });
          return;

        case "WITHDRAWAL_PROCESSING_CONFLICT":
          res.status(409).json({
            success: false,
            message: "Withdrawal is already being processed",
          });
          return;
      }
    }

    console.error("Withdrawal error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error while processing withdrawal",
    });
  }
};

export const getWithdrawals = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const withdrawals = await prisma.withdrawal.findMany({
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
        failureReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (withdrawals.length === 0) {
      return res.status(200).json({
        message: "No withdrawal history found",
        withdrawals: [],
      });
    }

    return res.status(200).json({
      message: "All withdrawals fetched successfully",
      withdrawals: withdrawals.map((withdrawal) => ({
        ...withdrawal,
        amount: withdrawal.amount.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getWithdrawal = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id: withdrawalId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!withdrawalId) {
      return res.status(400).json({
        message: "Invalid withdrawalId",
      });
    }

    const withdrawal = await prisma.withdrawal.findFirst({
      where: {
        id: withdrawalId as string,
        wallet: {
          userId,
        },
      },

      select: {
        id: true,
        amount: true,
        status: true,
        referenceId: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        requestedAt: true,
        bankAccount: {
          select: {
            bankName: true,
          }
        }
      },

    });

    if (!withdrawal) {
      return res.status(404).json({
        message: "Withdrawal not found",
      });
    }

    return res.status(200).json({
      message: "Withdrawal fetched successfully",
      withdrawal: {
        ...withdrawal,
        amount: withdrawal.amount.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching withdrawal:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

