import { Response } from "express";
import * as cookieOptions from "../configs/options/cookies.option";

export function assignAuthCookie(res: Response, jwtToken: string) {
  res.cookie("auth_token", jwtToken, cookieOptions.assignCookieOptions);
}
