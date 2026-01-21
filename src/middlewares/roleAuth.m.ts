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
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token missing",
      });
    }

    const decoded = jwt.verify(token, config.jwt_secret) as JwtPayload & {
      id?: string;
      role?: Role;
    };

    console.log("decoded ==> ", decoded);

    if (!decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid Token value",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id, role: decoded.role },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid user",
      });
    }

    if (!user.isVerified) {
      return res.status(404).json({
        success: false,
        message: "User email is not verified",
      });
    }

    req.user = {
      ...req.user,
      role: decoded.role,
      userId: decoded.id,
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
