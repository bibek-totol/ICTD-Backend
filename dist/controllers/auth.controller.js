"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailCode = exports.verifyEmail = exports.signup = exports.signin = void 0;
const prisma_config_1 = require("../configs/prisma.config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_util_1 = require("../utils/jwt.util");
const AppError_util_1 = require("../utils/AppError.util");
const sendMail_util_1 = require("../services/emails/sendMail.util");
const checkUserInput_utils_1 = require("../utils/checkUserInput.utils");
const generateKey_util_1 = require("../utils/generateKey.util");
const env_config_1 = __importDefault(require("../configs/env.config"));
const client_1 = require("@prisma/client");
const signin = async (req, res) => {
    try {
        let { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Email and password must be type string",
            });
        }
        email = email.toLowerCase().trim();
        password = password.trim();
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }
        if (!(0, checkUserInput_utils_1.isEmail)(email)) {
            return res.status(400).json({
                success: false,
                message: "email must be type email",
            });
        }
        const user = await prisma_config_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not exist",
            });
        }
        if (!user.isVerified) {
            return res.status(409).json({
                success: false,
                message: "User is not verified",
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        const payLoad = {
            id: user.id,
            role: user.role ?? client_1.Role.LabAdmin,
        };
        if (user?.role) {
            payLoad.role = user.role;
        }
        const typeCheck = (0, jwt_util_1.assignJwtToken)(req, res, payLoad);
        if (!typeCheck.success) {
            throw new AppError_util_1.AppError({
                fnc: "signin generateJwtToken",
                error: typeCheck?.error,
            });
        }
        // typeCheck.type === "Bearer" ---> MobileApp
        if (typeCheck.type === "Bearer") {
            return res.status(200).json({
                success: true,
                message: "Logged in successfully",
                token: typeCheck.token,
                data: {
                    id: user.id,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                },
            });
        }
        // typeCheck.type === "cookie" ---> WebApp
        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            data: {
                id: user.id,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
            },
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "signin", error });
    }
};
exports.signin = signin;
const signup = async (req, res) => {
    try {
        let { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Email and password must be type string",
            });
        }
        email = email.toLowerCase().trim();
        password = password.trim();
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }
        if (!(0, checkUserInput_utils_1.isEmail)(email)) {
            return res.status(400).json({
                success: false,
                message: "email must be type email",
            });
        }
        // Find user by email using Prisma
        const user = await prisma_config_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            // forbidden status code
            return res.status(404).json({
                success: false,
                message: "User not exist",
            });
        }
        // check it
        if (user.pageState !== client_1.PageState.VerifiedEmail) {
            return res.status(404).json({
                success: false,
                message: "please verify your email",
            });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        await prisma_config_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            },
        });
        const payLoad = {
            id: user.id,
            role: user.role ?? client_1.Role.LabAdmin,
        };
        if (user?.role) {
            payLoad.role = user.role;
        }
        const typeCheck = (0, jwt_util_1.assignJwtToken)(req, res, payLoad);
        if (!typeCheck.success) {
            throw new AppError_util_1.AppError({
                fnc: "signin generateJwtToken",
                error: typeCheck?.error,
            });
        }
        if (user.role === "SuperAdmin") {
            await prisma_config_1.prisma.user.update({
                where: {
                    email: email,
                },
                data: {
                    usersManagementKey: (0, generateKey_util_1.generateUsersManagementKey)(),
                },
            });
        }
        await prisma_config_1.prisma.user.update({
            where: {
                email: email,
            },
            data: {
                pageState: client_1.PageState.Registered,
            },
        });
        // typeCheck.type === "Bearer" ---> MobileApp
        if (typeCheck.type === "Bearer") {
            return res.status(200).json({
                success: true,
                message: "Logged in successfully",
                token: typeCheck.token,
                data: {
                    id: user.id,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                },
            });
        }
        // typeCheck.type === "cookie" ---> WebApp
        return res.status(201).json({
            success: true,
            message: "User Register successfully",
            data: {
                id: user.id,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
            },
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "signup", error });
    }
};
exports.signup = signup;
const verifyEmail = async (req, res) => {
    try {
        let { email } = req.body;
        if (typeof email !== "string") {
            return res.status(400).json({
                success: false,
                message: "Email must be type string",
            });
        }
        email = email.toLowerCase().trim();
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }
        if (!(0, checkUserInput_utils_1.isEmail)(email)) {
            return res.status(400).json({
                success: false,
                message: "email must be type email",
            });
        }
        // Find user by email using Prisma
        const user = await prisma_config_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        if (user.isVerified) {
            return res.status(409).json({
                success: false,
                message: "User already verified",
            });
        }
        // send email verification code from here
        const emailVerificationCode = await (0, sendMail_util_1.sendMailWithVerificationCode)(email);
        await prisma_config_1.prisma.user.update({
            where: { id: user.id },
            data: {
                pageState: client_1.PageState.SendVerifiedEmailCode,
                verificationCode: emailVerificationCode,
                verificationExpiry: new Date(Date.now() + env_config_1.default.email_verification_expiry * 24 * 60 * 60 * 1000),
            },
        });
        return res.status(201).json({
            success: true,
            message: "verification code sent in email",
            data: {
                email: user?.email,
            },
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "verifyEmail", error });
    }
};
exports.verifyEmail = verifyEmail;
const verifyEmailCode = async (req, res) => {
    try {
        let { email, emailCode } = req.body;
        if (typeof email === "string") {
            email = email.toLowerCase().trim();
        }
        if (typeof email !== "string" ||
            email.trim() === "" ||
            typeof emailCode !== "string" ||
            emailCode.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "emailCode and email are required",
            });
        }
        if (!(0, checkUserInput_utils_1.isEmail)(email)) {
            return res.status(400).json({
                success: false,
                message: "email must be type email",
            });
        }
        const user = await prisma_config_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User does not exist",
            });
        }
        if (user.isVerified) {
            return res.status(409).json({
                success: false,
                message: "User already verified",
            });
        }
        if (user.pageState !== client_1.PageState.SendVerifiedEmailCode) {
            return res.status(404).json({
                success: false,
                message: "please verify your email",
            });
        }
        //............................................................................
        if (!user.verificationCode) {
            return res.status(400).json({
                success: false,
                message: "No verification code found",
            });
        }
        if (user.verificationExpiry && new Date() > user.verificationExpiry) {
            return res.status(410).json({
                success: false,
                message: "Verification code expired",
            });
        }
        if (emailCode !== user.verificationCode) {
            return res.status(400).json({
                success: false,
                message: "Invalid email code",
            });
        }
        await prisma_config_1.prisma.user.update({
            where: { id: user.id },
            data: {
                pageState: client_1.PageState.VerifiedEmail,
                isVerified: true,
                verificationCode: null,
                verificationExpiry: null,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Email code verified successfully",
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({
            fnc: "checkEmailCode",
            error,
        });
    }
};
exports.verifyEmailCode = verifyEmailCode;
