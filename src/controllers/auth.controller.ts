// import express, { Request, Response } from "express";
// import { prisma } from "../configs/prisma.config";
// import bcrypt from "bcryptjs";
// import { assignJwtToken } from "../utils/jwt.util";

// export const signin = async (req: Request, res: Response) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({
//       success: false,
//       message: "Email and password are required",
//     });
//   }

//   try {
//     // Find user by email using Prisma
//     const user = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }

//     const payLoad = {
//       id: user.id,
//       role: user.role,
//     };

//     const typeCheck = assignJwtToken(req, res, payLoad);

//     if (typeCheck.type === "Bearer") {
//       return res.status(200).json({
//         success: true,
//         message: "Logged in successfully",
//         token: typeCheck.token,
//         data: {
//           id: user.id,
//           email: user.email,
//           phone: user.phone,
//           role: user.role,
//         },
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Logged in successfully",
//       data: {
//         id: user.id,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//       },
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }; 


// export const signup = async (req: Request, res: Response) => {
//   const { email, password, role = "user" } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({
//       success: false,
//       message: "All fields are required",
//     });
//   }

//   try {
//     // Check if user already exists using Prisma
//     const checkUser = await prisma.user.findUnique({
//       where: { email },
//     });


//     if (!checkUser?.isVerified) {
//       return res.status(409).json({
//         success: false,
//         message: "please verify your email",
//       });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create new user using Prisma
//     const user = await prisma.user.create({
//       data: {
//         email,
//         password: hashedPassword,
//         role,
//       },
//       select: {
//         id: true,
//         email: true,
//         role: true,
//         created_at: true,
//       },
//     });

//     const payLoad = {
//       id: user.id,
//       role: user.role,
//     };

//     const tokenResult = assignJwtToken(req, res, payLoad);

//     if (tokenResult.type === "Bearer") {
//       return res.status(201).json({
//         success: true,
//         message: "User created successfully",
//         token: tokenResult.token,
//         data: user,
//       });
//     }

//     return res.status(201).json({
//       success: true,
//       message: "User created successfully",
//       data: user,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };