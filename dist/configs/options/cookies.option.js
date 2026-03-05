"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCookieOptions = exports.assignCookieOptions = void 0;
/** Cookie and token lifetime: 5 hours (security: force re-login after 5h) */
const COOKIE_EXPIRE_HOURS = 5;
const COOKIE_MAX_AGE_MS = COOKIE_EXPIRE_HOURS * 60 * 60 * 1000;
exports.assignCookieOptions = {
    httpOnly: true,
    secure: true, // Always true for cross-site cookies
    sameSite: "none", // Required for cross-site cookies (Vercel)
    maxAge: COOKIE_MAX_AGE_MS,
};
exports.deleteCookieOptions = {
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
