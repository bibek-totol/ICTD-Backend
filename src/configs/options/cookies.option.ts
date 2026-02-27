import { CookieOptions } from "express";

const cookiesExpireTime: number = 7; // days

export const assignCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true, // Always true for cross-site cookies
  sameSite: "none", // Required for cross-site cookies (Vercel)
  maxAge: cookiesExpireTime * 24 * 60 * 60 * 1000, // 7 days
};

export const deleteCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 0,
};

// { oldAssignCookies
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     }
