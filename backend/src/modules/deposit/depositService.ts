
import { randomUUID } from "node:crypto";

import { prisma } from "../../../lib/prisma.js";

import {
  DepositStatus,
  Direction,
  LedgerEntryType,
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from "../../../generated/prisma/enums.js";

export const processDepositService = async (
  depositId: string,
  userId: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      const deposit = await tx.deposit.findFirst({
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
          transactionId: true,
          walletId: true,
          bankAccountId: true,

          wallet: {
            select: {
              status: true,
              cashBalance: true,
            },
          },

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

      if (!deposit) {
        throw new Error("DEPOSIT_NOT_FOUND");
      }

      // Idempotency: do not process an already successful deposit again.
      if (deposit.status === DepositStatus.SUCCESS) {
        return {
          deposit,
          bankAccount: deposit.bankAccount,
          balance: deposit.wallet.cashBalance,
          alreadyProcessed: true,
        };
      }

      if (deposit.status !== DepositStatus.PENDING) {
        throw new Error("INVALID_DEPOSIT_STATUS");
      }

      if (deposit.wallet.status !== WalletStatus.ACTIVE) {
        throw new Error("WALLET_INACTIVE");
      }

      if (!deposit.bankAccountId || !deposit.bankAccount) {
        throw new Error("BANK_ACCOUNT_REQUIRED");
      }

      const bankAccount = deposit.bankAccount;

      // Claim deposit to prevent duplicate processing.
      const claim = await tx.deposit.updateMany({
        where: {
          id: deposit.id,
          status: DepositStatus.PENDING,
        },
        data: {
          status: DepositStatus.PROCESSING,
        },
      });

      if (claim.count !== 1) {
        throw new Error("DEPOSIT_PROCESSING_CONFLICT");
      }

      // Deduct amount from the selected bank account.
      const bankDebit = await tx.bankAccount.updateMany({
        where: {
          id: bankAccount.id,
          userId,
          balance: {
            gte: deposit.amount,
          },
        },
        data: {
          balance: {
            decrement: deposit.amount,
          },
        },
      });

      if (bankDebit.count !== 1) {
        throw new Error("INSUFFICIENT_BANK_BALANCE");
      }

      // Credit the wallet.
      const wallet = await tx.wallet.update({
        where: {
          id: deposit.walletId,
        },
        data: {
          cashBalance: {
            increment: deposit.amount,
          },
        },
        select: {
          cashBalance: true,
        },
      });

      // Generate a unique deposit reference.
      const referenceId = `DEP-${randomUUID()}`;

      // Create transaction record.
      const transaction = await tx.transaction.create({
        data: {
          amount: deposit.amount,
          transactionType: TransactionType.DEPOSIT,
          status: TransactionStatus.SUCCESS,
          referenceId,
        },
      });

      // Create wallet ledger entry.
      await tx.ledgerEntry.create({
        data: {
          entryType: LedgerEntryType.DEPOSIT,
          amount: deposit.amount,
          direction: Direction.CREDIT,
          balanceAfter: wallet.cashBalance,
          walletId: deposit.walletId,
          transactionId: transaction.id,
          referenceId,
        },
      });

      // Mark deposit as successful.
      const completedDeposit = await tx.deposit.update({
        where: {
          id: deposit.id,
        },
        data: {
          status: DepositStatus.SUCCESS,
          completedAt: new Date(),
          transactionId: transaction.id,
          referenceId,
        },
        select: {
          id: true,
          amount: true,
          status: true,
          referenceId: true,
          requestedAt: true,
          completedAt: true,
          transactionId: true,
          bankAccountId: true,
        },
      });

      return {
        deposit: completedDeposit,
        bankAccount,
        balance: wallet.cashBalance,
        alreadyProcessed: false,
      };
    },
    {
      maxWait: 10_000,
      timeout: 15_000,
    },
  );
};
