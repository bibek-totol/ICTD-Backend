"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabAdminAuthorizationMiddleware = exports.UpazilaAdminAuthorizationMiddleware = exports.DistrictAdminAuthorizationMiddleware = exports.DivisionAdminAuthorizationMiddleware = exports.SuperAdminAuthorizationMiddleware = exports.AuthorizationMiddleware = void 0;
const client_1 = require("@prisma/client");
const AppError_util_1 = require("../utils/AppError.util");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = __importDefault(require("../configs/env.config"));
const prisma_config_1 = require("../configs/prisma.config");
/* AppErrorPayload structure
  scode?: number;          // HTTP status code
  fnc: string;            // function / API name
  msg?: string;            // custom message (optional)
  error: unknown;         // original error (optional)
*/
// Level3 Middleware
const AuthorizationMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Token missing",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_config_1.default.jwt_secret);
        console.log("decoded ==> ", decoded);
        if (!decoded.id || !decoded.role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid Token value",
            });
        }
        const user = await prisma_config_1.prisma.user.findUnique({
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
    }
    catch (error) {
        const payload = {
            fnc: "AuthorizationMiddleware",
            msg: `${"Error from AuthorizationMiddleware"}: ${error.message}`,
            error,
        };
        throw new AppError_util_1.AppError(payload);
    }
};
exports.AuthorizationMiddleware = AuthorizationMiddleware;
// Level4 Middlewares
const SuperAdminAuthorizationMiddleware = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found",
            });
        }
        if (req.user.role !== client_1.Role.SuperAdmin) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Admin only",
            });
        }
        next();
    }
    catch (error) {
        const payload = {
            fnc: "superAdminAuthorizationMiddleware",
            msg: `${"Error from superAdminAuthorizationMiddleware"}: ${error.message}`,
            error,
        };
        throw new AppError_util_1.AppError(payload);
    }
};
exports.SuperAdminAuthorizationMiddleware = SuperAdminAuthorizationMiddleware;
const DivisionAdminAuthorizationMiddleware = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found",
            });
        }
        if (req.user.role !== client_1.Role.DivisionAdmin) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: DivisionAdmin only",
            });
        }
        next();
    }
    catch (error) {
        const payload = {
            fnc: "DivisionAdminAuthorizationMiddleware",
            msg: `${"Error from DivisionAdminAuthorizationMiddleware"}: ${error.message}`,
            error,
        };
        throw new AppError_util_1.AppError(payload);
    }
};
exports.DivisionAdminAuthorizationMiddleware = DivisionAdminAuthorizationMiddleware;
const DistrictAdminAuthorizationMiddleware = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found",
            });
        }
        if (req.user.role !== client_1.Role.DistrictAdmin) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: DistrictAdmin only",
            });
        }
        next();
    }
    catch (error) {
        const payload = {
            fnc: "DistrictAdminAuthorizationMiddleware",
            msg: `${"Error from DistrictAdminAuthorizationMiddleware"}: ${error.message}`,
            error,
        };
        throw new AppError_util_1.AppError(payload);
    }
};
exports.DistrictAdminAuthorizationMiddleware = DistrictAdminAuthorizationMiddleware;
const UpazilaAdminAuthorizationMiddleware = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found",
            });
        }
        if (req.user.role !== client_1.Role.UpazilaAdmin) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: UpazilaAdmin only",
            });
        }
        next();
    }
    catch (error) {
        const payload = {
            fnc: "UpazilaAdminAuthorizationMiddleware",
            msg: `${"Error from UpazilaAdminAuthorizationMiddleware"}: ${error.message}`,
            error,
        };
        throw new AppError_util_1.AppError(payload);
    }
};
exports.UpazilaAdminAuthorizationMiddleware = UpazilaAdminAuthorizationMiddleware;
const LabAdminAuthorizationMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found",
            });
        }
        if (req.user.role !== client_1.Role.LabAdmin) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: LabAdmin only",
            });
        }
        next();
    }
    catch (error) {
        const payload = {
            fnc: "LabAdminAuthorizationMiddleware",
            msg: `${"Error from LabAdminAuthorizationMiddleware"}: ${error.message}`,
            error,
        };
        throw new AppError_util_1.AppError(payload);
    }
};
exports.LabAdminAuthorizationMiddleware = LabAdminAuthorizationMiddleware;
