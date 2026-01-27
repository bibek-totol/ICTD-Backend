"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCookieOptions = exports.assignCookieOptions = void 0;
const cookiesExpireTime = 7; // days
exports.assignCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: cookiesExpireTime * 24 * 60 * 60 * 1000, // 7 ddays
};
exports.deleteCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // immediate make it 0
};
// { oldAssignCookies
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     }
