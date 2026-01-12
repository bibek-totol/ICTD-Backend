import { CookieOptions } from "express";

const cookiesExpireTime: number = 7; // days

export const assignCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: cookiesExpireTime * 24 * 60 * 60 * 1000, // 7 ddays
};

export const deleteCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 0, // immediate make it 0
};
