import express, { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import bcrypt from "bcryptjs";
import { assignJwtToken } from "../utils/jwt.util";
import { CookiesAuthPayLoad } from "../interfaces_and_types/CookiesPayLoad.interface";
import { ReqTypeEnum } from "../interfaces_and_types/ReqType.enum";
import { AppError } from "../utils/AppError.util";
import { sendMailWithVerificationCode } from "../services/emails/sendMail.util";
import { isEmail } from "../utils/checkUserInput.utils";
import { generateUsersManagementKey } from "../utils/generateKey.util";
import config from "../configs/env.config";
import { PageState } from "@prisma/client";
import { Role } from "@prisma/client";

export const signin = async (req: Request, res: Response) => {
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

    if (!isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "email must be type email",
      });
    }

    // Find user by email using Prisma
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // forbidden status code
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

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const payLoad: CookiesAuthPayLoad = {
      id: user.id,
    };
    if (user?.role) {
      payLoad.role = user.role;
    }

    const typeCheck = assignJwtToken(req, res, payLoad);

    if (!typeCheck.success) {
      throw new AppError({
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
  } catch (error: any) {
    throw new AppError({ fnc: "signin", error });
  }
};

export const signup = async (req: Request, res: Response) => {
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

    if (!isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "email must be type email",
      });
    }

    // Find user by email using Prisma
    const user = await prisma.user.findUnique({
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
    if (user.pageState !== PageState.VerifiedEmail) {
      return res.status(404).json({
        success: false,
        message: "please verify your email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    const payLoad: CookiesAuthPayLoad = {
      id: user.id,
    };
    if (user?.role) {
      payLoad.role = user.role;
    }

    const typeCheck = assignJwtToken(req, res, payLoad);

    if (!typeCheck.success) {
      throw new AppError({
        fnc: "signin generateJwtToken",
        error: typeCheck?.error,
      });
    }

    if (user.role === "SuperAdmin") {
      await prisma.user.update({
        where: {
          email: email,
        },
        data: {
          usersManagementKey: generateUsersManagementKey(),
        },
      });
    }

    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        pageState: PageState.Registered,
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
  } catch (error: any) {
    throw new AppError({ fnc: "signup", error });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
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

    if (!isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "email must be type email",
      });
    }

    // Find user by email using Prisma
    const user = await prisma.user.findUnique({
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
    const emailVerificationCode = await sendMailWithVerificationCode(email);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        pageState: PageState.SendVerifiedEmailCode,
        verificationCode: emailVerificationCode,
        verificationExpiry: new Date(
          Date.now() + config.email_verification_expiry * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return res.status(201).json({
      success: true,
      message: "verification code sent in email",
      data: {
        email: user?.email,
      },
    });
  } catch (error: any) {
    throw new AppError({ fnc: "verifyEmail", error });
  }
};

export const verifyEmailCode = async (req: Request, res: Response) => {
  try {
    let { email, emailCode } = req.body;

    if (typeof email === "string") {
      email = email.toLowerCase().trim();
    }

    if (
      typeof email !== "string" ||
      email.trim() === "" ||
      typeof emailCode !== "string" ||
      emailCode.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "emailCode and email are required",
      });
    }

    if (!isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "email must be type email",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

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

    if (user.pageState !== PageState.SendVerifiedEmailCode) {
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        pageState: PageState.VerifiedEmail,
        isVerified: true,
        verificationCode: null,
        verificationExpiry: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Email code verified successfully",
    });
  } catch (error: any) {
    throw new AppError({
      fnc: "checkEmailCode",
      error,
    });
  }
};
