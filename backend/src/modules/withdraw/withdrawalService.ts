import { randomUUID } from "node:crypto";

import {
  WalletStatus,
  WithdrawalStatus,
} from "../../../generated/prisma/enums.js";

import { prisma } from "../../../lib/prisma.js";

export const processWithdrawalService = async (
  withdrawalId: string,
  userId: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      const withdrawal = await tx.withdrawal.findFirst({
        where: {
          id: withdrawalId,
          wallet: {
            userId,
          },
        },
        select: {
          id: true,
          amount: true,
          status: true,
          referenceId: true,
          transactionId: true,
          completedAt: true,
          bankAccountId: true,
          walletId: true,
          wallet: {
            select: {
              status: true,
              cashBalance: true,
              reservedWithdrawals: true,
            },
          },
        },
      });

      if (!withdrawal) {
        throw new Error("WITHDRAWAL_NOT_FOUND");
      }

      // Idempotency: do not process a successful withdrawal twice.
      if (withdrawal.status === WithdrawalStatus.SUCCESS) {
        return {
          withdrawal,
          balance: withdrawal.wallet.cashBalance,
          alreadyProcessed: true,
        };
      }

      if (withdrawal.status !== WithdrawalStatus.PENDING) {
        throw new Error("INVALID_WITHDRAWAL_STATUS");
      }

      if (withdrawal.wallet.status !== WalletStatus.ACTIVE) {
        throw new Error("WALLET_INACTIVE");
      }

      if (!withdrawal.bankAccountId) {
        throw new Error("BANK_ACCOUNT_REQUIRED");
      }

      // Confirm that the destination bank account belongs to this user.
      const bankAccount = await tx.bankAccount.findFirst({
        where: {
          id: withdrawal.bankAccountId,
          userId,
        },
        select: {
          id: true,
        },
      });

      if (!bankAccount) {
        throw new Error("BANK_ACCOUNT_NOT_FOUND");
      }

      // Claim the withdrawal so it cannot be processed twice.
      const claim = await tx.withdrawal.updateMany({
        where: {
          id: withdrawal.id,
          status: WithdrawalStatus.PENDING,
          wallet: {
            userId,
          },
        },
        data: {
          status: WithdrawalStatus.PROCESSING,
        },
      });

      if (claim.count !== 1) {
        throw new Error("WITHDRAWAL_PROCESSING_CONFLICT");
      }

      // Deduct the withdrawal and release its reserved funds atomically.
      const walletDebit = await tx.wallet.updateMany({
        where: {
          id: withdrawal.walletId,
          userId,
          status: WalletStatus.ACTIVE,
          cashBalance: {
            gte: withdrawal.amount,
          },
          reservedWithdrawals: {
            gte: withdrawal.amount,
          },
        },
        data: {
          cashBalance: {
            decrement: withdrawal.amount,
          },
          reservedWithdrawals: {
            decrement: withdrawal.amount,
          },
        },
      });

      if (walletDebit.count !== 1) {
        throw new Error("INSUFFICIENT_WALLET_BALANCE");
      }

      // Read the actual resulting wallet balance for the ledger.
      const updatedWallet = await tx.wallet.findFirst({
        where: {
          id: withdrawal.walletId,
          userId,
        },
        select: {
          cashBalance: true,
        },
      });

      if (!updatedWallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      const referenceId = `WD-${randomUUID()}`;

      // Record the withdrawal transaction.
      const transaction = await tx.transaction.create({
        data: {
          amount: withdrawal.amount,
          transactionType: "WITHDRAW",
          referenceId,
          status: "SUCCESS",
        },
      });

      // Record the corresponding debit in the wallet ledger.
      await tx.ledgerEntry.create({
        data: {
          entryType: "WITHDRAW",
          amount: withdrawal.amount,
          direction: "DEBIT",
          balanceAfter: updatedWallet.cashBalance,
          walletId: withdrawal.walletId,
          transactionId: transaction.id,
          referenceId,
        },
      });

      /*
       * SIMULATION ONLY:
       * This updates the bank account balance in your database.
       * It does not transfer real money through the banking system.
       */
      await tx.bankAccount.update({
        where: {
          id: bankAccount.id,
        },
        data: {
          balance: {
            increment: withdrawal.amount,
          },
        },
      });

      // Mark the withdrawal as completed.
      const completedWithdrawal = await tx.withdrawal.update({
        where: {
          id: withdrawal.id,
        },
        data: {
          status: WithdrawalStatus.SUCCESS,
          referenceId,
          transactionId: transaction.id,
          completedAt: new Date(),
          failureReason: null,
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

      return {
        withdrawal: completedWithdrawal,
        balance: updatedWallet.cashBalance,
        alreadyProcessed: false,
      };
    },
  );
};