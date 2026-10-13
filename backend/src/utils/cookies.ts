import type { Response } from "express";

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
};

export const clearTokens = (res: Response) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
};