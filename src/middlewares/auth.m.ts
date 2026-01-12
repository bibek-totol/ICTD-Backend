import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import checkUserAgent from "../utils/checkUserAgent.util";
import config from "../configs/env.config";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const authenticateMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const isBrowser = checkUserAgent(req);
    const secret = config.jwt_secret;

    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    let token: string | undefined;

    if (isBrowser) {
      token = req.cookies?.token;
    }
    // Postman / Mobile → Read Bearer header
    else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        redirect: "/api/v1/auth/signin",
      });
    }

    // Validate token
    const decoded = jwt.verify(token, secret) as { id: string; role: string };

    // Attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    console.log("req ==> ", req?.user);

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      redirect: "/api/v1/auth/signin",
    });
  }
};

export default authenticateMiddleware;
