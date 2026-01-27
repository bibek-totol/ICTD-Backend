import jwt from "jsonwebtoken";
import checkUserAgent from "./checkUserAgent.util";
import { ReqTypeEnum } from "../interfaces_and_types/ReqType.enum";
import { assignCookieOptions, } from "../configs/options/cookies.option";
const JWT_SECRET = process.env.JWT_SECRET;
export function generateJwtToken(payload, options = {}) {
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
export function assignJwtToken(req, res, payload) {
    try {
        const { ReqType } = req.body;
        const isBrowser = checkUserAgent(req);
        // check ReqType === "mobileApps" || !isBrowser ---> then it is mobileApplication
        // else ---> it is webApplication
        const token = generateJwtToken(payload);
        if (ReqType === ReqTypeEnum.MobileApp && !isBrowser) {
            // return bearer token for mobile, postman, APIs
            return {
                success: true,
                type: "Bearer",
                token,
                message: "Token assigned via bearer",
            };
        }
        // when it is web
        res.cookie("token", token, assignCookieOptions);
        return {
            success: true,
            type: "cookie",
            token: null, // browser doesn't need returned token
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
export function deleteJwtToken(req, res, payload) {
    const { ReqType } = req.body;
    const isBrowser = checkUserAgent(req);
    // check ReqType === "mobileApps" || !isBrowser ---> then it is mobileApplication
    // else ---> it is webApplication
    const token = generateJwtToken(payload);
    if (ReqType === ReqTypeEnum.MobileApp && !isBrowser) {
        // return bearer token for mobile, postman, APIs
        return {
            type: "Bearer",
            token,
            message: "Token assigned via bearer",
        };
    }
    // when it is web
    res.cookie("token", token, assignCookieOptions);
    return {
        type: "cookie",
        token: null, // browser doesn't need returned token
        message: "Token assigned via cookies",
    };
}
export function verifyJwtToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded; // contains { id: userId, iat, exp }
    }
    catch (error) {
        return null;
    }
}
