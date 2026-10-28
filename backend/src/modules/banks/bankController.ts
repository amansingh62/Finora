import type { Request, Response } from "express";
import { BankName } from "../../../generated/prisma/enums.js";
import { prisma } from "../../../lib/prisma.js";

export const linkBankAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { bankName, accountHolder, accountNumber, ifscCode } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      typeof bankName !== "string" ||
      typeof accountHolder !== "string" ||
      typeof accountNumber !== "string" ||
      typeof ifscCode !== "string" ||
      !accountHolder.trim() ||
      !accountNumber.trim() ||
      !ifscCode.trim()
    ) {
      return res.status(400).json({
        message: "Invalid account details",
      });
    }

    if (!Object.values(BankName).includes(bankName as BankName)) {
      return res.status(400).json({
        message: "Invalid bank name",
      });
    }

    const normalizedAccountNumber = accountNumber.trim();
    const normalizedIfscCode = ifscCode.trim().toUpperCase();

    const existingAccount = await prisma.bankAccount.findUnique({
      where: {
        accountNumber: normalizedAccountNumber,
      },
      select: {
        id: true,
      },
    });
    if (existingAccount) {
      return res.status(409).json({
        message: "This bank account is already linked",
      });
    }

    const userBankAccount = await prisma.bankAccount.findFirst({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    const isPrimary = !userBankAccount;

    const linkedAccount = await prisma.bankAccount.create({
      data: {
        userId,
        bankName: bankName as BankName,
        accountHolder: accountHolder.trim(),
        accountNumber: normalizedAccountNumber,
        ifscCode: normalizedIfscCode,
        isPrimary,
      },
      select: {
        id: true,
        bankName: true,
        accountHolder: true,
        accountNumber: true,
        ifscCode: true,
        isPrimary: true,
        balance: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Bank account linked successfully",
      account: {
        ...linkedAccount,
        accountNumber: `****${linkedAccount.accountNumber.slice(-4)}`,
      },
    });
  } catch (error) {
    console.error("Link bank account error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        message: "This bank account is already linked",
      });
    }

    return res.status(500).json({
      message: "Failed to link bank account",
    });
  }
};

export const getAllBankAccounts = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        bankName: true,
        accountHolder: true,
        accountNumber: true,
        ifscCode: true,
        isPrimary: true,
        balance: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Bank accounts fetched successfully",
      count: bankAccounts.length,
      bankAccounts: bankAccounts.map((account) => ({
        ...account,
        accountNumber: `****${account.accountNumber.slice(-4)}`,
      })),
    });
  } catch (error) {
    console.error("Get bank accounts error:", error);

    return res.status(500).json({
      message: "Failed to fetch bank accounts",
    });
  }
};

export const getBankAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id: bankAccountId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!bankAccountId) {
      return res.status(400).json({
        message: "Bank account ID is required",
      });
    }

    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId as string,
        userId,
      },
      select: {
        id: true,
        bankName: true,
        accountHolder: true,
        accountNumber: true,
        ifscCode: true,
        isPrimary: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!bankAccount) {
      return res.status(404).json({
        message: "Bank account not found",
      });
    }

    return res.status(200).json({
      message: "Bank account fetched successfully",
      bankAccount: {
        ...bankAccount,
        accountNumber: `****${bankAccount.accountNumber.slice(-4)}`,
      },
    });
  } catch (error) {
    console.error("Get bank account error:", error);

    return res.status(500).json({
      message: "Failed to fetch bank account",
    });
  }
};

export const makePrimaryAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id: bankAccountId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!bankAccountId) {
      return res.status(400).json({ message: "Bank account ID is required" });
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      const selectedAccount = await tx.bankAccount.findFirst({
        where: { id: bankAccountId as string, userId },
        select: { id: true, isPrimary: true },
      });

      if (!selectedAccount) {
        throw new Error("Bank account not found");
      }

      if (selectedAccount.isPrimary) {
        throw new Error("This is already your primary bank account");
      }

      await tx.bankAccount.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });

      return await tx.bankAccount.update({
        where: { id: bankAccountId as string },
        data: { isPrimary: true },
        select: {
          id: true,
          bankName: true,
          accountHolder: true,
          accountNumber: true,
          isPrimary: true,
        },
      });
    });

    return res.status(200).json({
      message: "Primary bank account updated successfully",
      account: {
        ...updatedAccount,
        accountNumber: `****${updatedAccount.accountNumber.slice(-4)}`,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Bank account not found") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message === "This is already your primary bank account") {
        return res.status(400).json({ message: error.message });
      }
    }

    console.error("Make primary account error:", error);
    return res.status(500).json({
      message: "Failed to update primary bank account",
    });
  }
};

export const unlinkBankAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id: bankAccountId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!bankAccountId) {
      return res.status(400).json({ message: "Bank account ID is required" });
    }

    const result = await prisma.$transaction(async (tx) => {

      const bankAccount = await tx.bankAccount.findFirst({
        where: {
          id: bankAccountId as string,
          userId,
        },
        select: {
          id: true,
          isPrimary: true,
        },
      });

      if (!bankAccount) {
        throw new Error("Bank account not found");
      }

      if (bankAccount.isPrimary) {
        const replacementAccount = await tx.bankAccount.findFirst({
          where: {
            userId,
            id: { not: bankAccountId as string },
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
          },
        });

        if (replacementAccount) {
          await tx.bankAccount.update({
            where: {
              id: replacementAccount.id,
            },
            data: {
              isPrimary: true,
            },
          });
        }
      }

      await tx.bankAccount.delete({
        where: {
          id: bankAccountId as string,
        },
      });

      return {
        wasPrimary: bankAccount.isPrimary,
      };
    });

    return res.status(200).json({
      message: result.wasPrimary
        ? "Bank account unlinked successfully. Another account has been set as primary if available."
        : "Bank account unlinked successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Bank account not found") {
      return res.status(404).json({ message: error.message });
    }

    console.error("Unlink bank account error:", error);

    return res.status(500).json({
      message: "Failed to unlink bank account",
    });
  }
};
