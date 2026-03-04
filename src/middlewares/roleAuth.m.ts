import { Response, NextFunction, RequestHandler } from "express";
import AppRequest from "../interfaces_and_types/AppRequest.interface";
import { Role } from "@prisma/client";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import { AppError } from "../utils/AppError.util";
import jwt from "jsonwebtoken";
import config from "../configs/env.config";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../configs/prisma.config";

/* AppErrorPayload structure
  scode?: number;          // HTTP status code
  fnc: string;            // function / API name
  msg?: string;            // custom message (optional)
  error: unknown;         // original error (optional)
*/

// Level3 Middleware
export const AuthorizationMiddleware = async (
  req: AppRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token = req.cookies?.token;

    // Logic: Try cookie first. If no cookie OR if we want to support both simultaneously, check header.
    // In cross-site Vercel, cookies are often blocked, so the Header is the most reliable fallback.
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access token missing. Please sign in.",
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt_secret);
    } catch (err) {
      // If cookie failed, try the Authorization header one more time as a last resort
      if (req.headers.authorization?.startsWith("Bearer ")) {
        const headerToken = req.headers.authorization.split(" ")[1];
        if (headerToken !== token) {
          try {
            decoded = jwt.verify(headerToken, config.jwt_secret);
            token = headerToken; // Update token to the valid one
          } catch (secondErr) {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
          }
        } else {
          return res.status(401).json({ success: false, message: "Unauthorized: Token expired or invalid" });
        }
      } else {
        return res.status(401).json({ success: false, message: "Unauthorized: Token expired or invalid" });
      }
    }

    console.log("decoded ==> ", decoded);

    if (!decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid Token value",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.role !== decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Invalid session or user not found. Please log in again.",
      });
    }

    if (!user.isVerified) {
      return res.status(404).json({
        success: false,
        message: "User email is not verified",
      });
    }

    (req as any).user = {
      role: decoded.role,
      userId: decoded.id,
      // Attach jurisdiction so controllers can enforce role-based data scoping
      division: (user as any).division ?? null,
      district: (user as any).district ?? null,
      upazila: (user as any).upazila ?? null,
      email: user.email,
    };

    console.log("req.user ==> ", req.user);

    next();
  } catch (error: any) {
    const payload: AppErrorPayload = {
      fnc: "AuthorizationMiddleware",
      msg: `${"Error from AuthorizationMiddleware"}: ${error.message}`,
      error,
    };
    throw new AppError(payload);
  }
};

// Level4 Middlewares
export const SuperAdminAuthorizationMiddleware = (
  req: AppRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    if (req.user.role !== Role.SuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin only",
      });
    }

    next();
  } catch (error: any) {
    const payload: AppErrorPayload = {
      fnc: "superAdminAuthorizationMiddleware",
      msg: `${"Error from superAdminAuthorizationMiddleware"}: ${error.message}`,
      error,
    };
    throw new AppError(payload);
  }
};

export const DivisionAdminAuthorizationMiddleware = (
  req: AppRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    if (req.user.role !== Role.DivisionAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: DivisionAdmin only",
      });
    }

    next();
  } catch (error: any) {
    const payload: AppErrorPayload = {
      fnc: "DivisionAdminAuthorizationMiddleware",
      msg: `${"Error from DivisionAdminAuthorizationMiddleware"}: ${error.message}`,
      error,
    };
    throw new AppError(payload);
  }
};

export const DistrictAdminAuthorizationMiddleware = (
  req: AppRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    if (req.user.role !== Role.DistrictAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: DistrictAdmin only",
      });
    }

    next();
  } catch (error: any) {
    const payload: AppErrorPayload = {
      fnc: "DistrictAdminAuthorizationMiddleware",
      msg: `${"Error from DistrictAdminAuthorizationMiddleware"}: ${error.message}`,
      error,
    };
    throw new AppError(payload);
  }
};

export const UpazilaAdminAuthorizationMiddleware = (
  req: AppRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    if (req.user.role !== Role.UpazilaAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: UpazilaAdmin only",
      });
    }

    next();
  } catch (error: any) {
    const payload: AppErrorPayload = {
      fnc: "UpazilaAdminAuthorizationMiddleware",
      msg: `${"Error from UpazilaAdminAuthorizationMiddleware"}: ${error.message}`,
      error,
    };
    throw new AppError(payload);
  }
};

export const LabAdminAuthorizationMiddleware = async (
  req: AppRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    if (req.user.role !== Role.LabAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: LabAdmin only",
      });
    }

    next();
  } catch (error: any) {
    const payload: AppErrorPayload = {
      fnc: "LabAdminAuthorizationMiddleware",
      msg: `${"Error from LabAdminAuthorizationMiddleware"}: ${error.message}`,
      error,
    };
    throw new AppError(payload);
  }
};
