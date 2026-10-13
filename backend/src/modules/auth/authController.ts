import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../../lib/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/tokens.js";
import { setAuthCookies } from "../../utils/cookies.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Invalid name",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      message: "User logged in successfully",
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const payload = verifyRefreshToken(oldRefreshToken);

    if (!payload) {
      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        token: oldRefreshToken,
      },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    await prisma.refreshToken.delete({
      where: {
        id: storedToken.id,
      },
    });

    const accessToken = signAccessToken(storedToken.user.id);
    const newRefreshToken = signRefreshToken(storedToken.user.id);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setAuthCookies(res, accessToken, newRefreshToken);

    return res.status(200).json({
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const me = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return res.status(200).json({ message: "User fetched successfully", user });
};
