import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import checkUserAgent from "./checkUserAgent.util";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function generateJwtToken(
  payload: object,
  options: SignOptions = {}
): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const token = jwt.sign(payload, secret, {
    expiresIn: "7d",
    ...options,
  });

  return token;
}

export function assignJwtToken(req: Request, res: Response, payload: object) {
  const isBrowser = checkUserAgent(req);

  const token = generateJwtToken(payload);

  if (isBrowser) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      type: "cookie",
      token: null, // browser doesn't need returned token
      message: "Token assigned via cookies",
    };
  }

  // return bearer token for mobile, postman, APIs
  return {
    type: "Bearer",
    token,
    message: "Token assigned via bearer",
  };
}

export function verifyJwtToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded; // contains { id: userId, iat, exp }
  } catch (error) {
    return null;
  }
}
