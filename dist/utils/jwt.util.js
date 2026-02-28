"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJwtToken = generateJwtToken;
exports.assignJwtToken = assignJwtToken;
exports.deleteJwtToken = deleteJwtToken;
exports.verifyJwtToken = verifyJwtToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const checkUserAgent_util_1 = __importDefault(require("./checkUserAgent.util"));
const ReqType_enum_1 = require("../interfaces_and_types/ReqType.enum");
const cookies_option_1 = require("../configs/options/cookies.option");
const JWT_SECRET = process.env.JWT_SECRET;
function generateJwtToken(payload, options = {}) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const token = jsonwebtoken_1.default.sign(payload, secret, {
        expiresIn: "7d",
        ...options,
    });
    return token;
}
function assignJwtToken(req, res, payload) {
    try {
        const { ReqType } = req.body;
        const isBrowser = (0, checkUserAgent_util_1.default)(req);
        // check ReqType === "mobileApps" || !isBrowser ---> then it is mobileApplication
        // else ---> it is webApplication
        const token = generateJwtToken(payload);
        if (ReqType === ReqType_enum_1.ReqTypeEnum.MobileApp && !isBrowser) {
            // return bearer token for mobile, postman, APIs
            return {
                success: true,
                type: "Bearer",
                token,
                message: "Token assigned via bearer",
            };
        }
        // when it is web
        res.cookie("token", token, cookies_option_1.assignCookieOptions);
        return {
            success: true,
            type: "cookie",
            token, // Return token so frontend can use it in headers as backup
            message: "Token assigned via cookies",
        };
    }
    catch (error) {
        return {
            success: false,
            type: null,
            token: null, // browser doesn't need returned token
            message: error.message,
            error,
        };
    }
}
function deleteJwtToken(req, res) {
    try {
        const isBrowser = (0, checkUserAgent_util_1.default)(req);
        if (isBrowser) {
            res.cookie("token", "", cookies_option_1.deleteCookieOptions);
        }
        return {
            success: true,
            message: "Token cleared successfully",
        };
    }
    catch (error) {
        return {
            success: false,
            message: error.message,
            error,
        };
    }
}
function verifyJwtToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded; // contains { id: userId, iat, exp }
    }
    catch (error) {
        return null;
    }
}
