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
  return prisma.$transaction(async (tx) => {
    const deposit = await tx.deposit.findFirst({
      where: {
        id: depositId,
        wallet: { userId },
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
      },
    });

    if (!deposit) {
      throw new Error("DEPOSIT_NOT_FOUND");
    }

    if (deposit.status === DepositStatus.SUCCESS) {
      return {
        deposit,
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

    if (!deposit.bankAccountId) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    const bankAccount = await tx.bankAccount.findFirst({
      where: {
        id: deposit.bankAccountId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!bankAccount) {
      throw new Error("BANK_ACCOUNT_NOT_FOUND");
    }

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

    const transaction = await tx.transaction.create({
      data: {
        amount: deposit.amount,
        transactionType: TransactionType.DEPOSIT,
        status: TransactionStatus.SUCCESS,
        referenceId: `deposit:${deposit.id}`,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        entryType: LedgerEntryType.DEPOSIT,
        amount: deposit.amount,
        direction: Direction.CREDIT,
        balanceAfter: wallet.cashBalance,
        walletId: deposit.walletId,
        transactionId: transaction.id,
        referenceId: `deposit:${deposit.id}`,
      },
    });

    const completedDeposit = await tx.deposit.update({
      where: {
        id: deposit.id,
      },
      data: {
        status: DepositStatus.SUCCESS,
        completedAt: new Date(),
        transactionId: transaction.id,
        referenceId: `deposit:${deposit.id}`,
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
      balance: wallet.cashBalance,
      alreadyProcessed: false,
    };
  });
};
