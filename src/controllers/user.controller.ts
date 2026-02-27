import { Request, Response } from "express"; // Restarting server to pick up Prisma changes
import { prisma } from "../configs/prisma.config";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { AppError } from "../utils/AppError.util";
import AppRequest from "../interfaces_and_types/AppRequest.interface";
import { isEmail, isValidRole } from "../utils/checkUserInput.utils";
import cloudinary from "../configs/cloudinary.config";


// GET all users (SuperAdmin only)
export const getAllUsers = async (req: AppRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                userName: true,
                email: true,
                password: true,
                plainPassword: true,
                phoneNumber: true,
                altPhoneNumber: true,
                imageUrl: true,
                role: true,
                division: true,
                district: true,
                upazila: true,
                designation: true,
                isVerified: true,
                pageState: true,
                createdAt: true,
                updatedAt: true,
            } as any,
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: users,
        });
    } catch (error: any) {
        throw new AppError({ fnc: "getAllUsers", error });
    }
};

// CREATE a new user (SuperAdmin only)
export const createUser = async (req: AppRequest, res: Response) => {
    try {
        let {
            userName,
            email,
            password,
            phoneNumber,
            altPhoneNumber,
            role,
            division,
            district,
            upazila,
            designation,
            imageUrl,
        } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        email = email.toLowerCase().trim();

        if (!isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: "User already exists with this email" });
        }

        // Validate role
        if (role && !isValidRole(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        // Hash password
        const passwordToUse = password?.trim() || "govt@doict.pass";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordToUse, salt);

        const newUser = await prisma.user.create({
            data: {
                userName: userName?.trim() || null,
                email,
                password: hashedPassword,
                phoneNumber: phoneNumber?.trim() || null,
                altPhoneNumber: altPhoneNumber?.trim() || null,
                imageUrl: imageUrl?.trim() || "https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png",
                role: role as Role || Role.LabAdmin,
                division: division?.trim() || null,
                district: district?.trim() || null,
                upazila: upazila?.trim() || null,
                designation: designation?.trim() || null,
                isVerified: false,
                pageState: "Default",
                plainPassword: password?.trim() || "govt@doict.pass",
            } as any,
            select: {
                id: true,
                userName: true,
                email: true,
                phoneNumber: true,
                role: true,
                division: true,
                district: true,
                upazila: true,
                designation: true,
                isVerified: true,
                createdAt: true,
            } as any,
        });

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: newUser,
        });
    } catch (error: any) {
        throw new AppError({ fnc: "createUser", error });
    }
};

// DELETE a user (SuperAdmin only)
export const deleteUser = async (req: AppRequest, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Prevent self-deletion
        if (user.id === req.user?.userId) {
            return res.status(400).json({ success: false, message: "Cannot delete your own account" });
        }

        // Prevent deleting SuperAdmin
        if (user.role === Role.SuperAdmin) {
            return res.status(403).json({ success: false, message: "Cannot delete a SuperAdmin" });
        }

        await prisma.user.delete({ where: { id: userId } });

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error: any) {
        throw new AppError({ fnc: "deleteUser", error });
    }
};

// VERIFY a single user (SuperAdmin only)
export const verifyUser = async (req: AppRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { isVerified, password } = req.body;

        if (typeof isVerified !== "boolean") {
            return res.status(400).json({ success: false, message: "isVerified must be boolean" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const updateData: any = {
            isVerified,
            pageState: isVerified ? "Registered" : "Default",
        };

        if (isVerified && password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password.trim(), salt);
            updateData.plainPassword = password.trim();
        } else if (!isVerified) {
            // Reset to default on unverify
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash("govt@doict.pass", salt);
            updateData.plainPassword = "govt@doict.pass";
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                userName: true,
                email: true,
                role: true,
                isVerified: true,
                plainPassword: true,
            } as any,
        });

        return res.status(200).json({
            success: true,
            message: `User ${isVerified ? "verified" : "unverified"} successfully`,
            data: updatedUser,
        });
    } catch (error: any) {
        throw new AppError({ fnc: "verifyUser", error });
    }
};

// VERIFY ALL users at once (SuperAdmin only)
export const verifyAllUsers = async (req: AppRequest, res: Response) => {
    try {
        const { isVerified } = req.body;

        if (typeof isVerified !== "boolean") {
            return res.status(400).json({ success: false, message: "isVerified must be boolean" });
        }

        const updateData: any = {
            isVerified,
            pageState: isVerified ? "Registered" : "Default",
        };

        if (!isVerified) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash("govt@doict.pass", salt);
            updateData.plainPassword = "govt@doict.pass";
        }

        // Skip SuperAdmins when bulk changing
        const result = await prisma.user.updateMany({
            where: {
                role: { not: Role.SuperAdmin },
            },
            data: updateData,
        });

        return res.status(200).json({
            success: true,
            message: `${result.count} users ${isVerified ? "verified" : "unverified"} successfully`,
            count: result.count,
        });
    } catch (error: any) {
        throw new AppError({ fnc: "verifyAllUsers", error });
    }
};

// UPDATE user (SuperAdmin only)
export const updateUser = async (req: AppRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const {
            userName,
            phoneNumber,
            altPhoneNumber,
            role,
            division,
            district,
            upazila,
            designation,
            imageUrl,
            password,
        } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const updateData: any = {};
        if (userName !== undefined) updateData.userName = userName?.trim() || null;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber?.trim() || null;
        if (altPhoneNumber !== undefined) updateData.altPhoneNumber = altPhoneNumber?.trim() || null;
        if (designation !== undefined) updateData.designation = designation?.trim() || null;
        if (division !== undefined) updateData.division = division?.trim() || null;
        if (district !== undefined) updateData.district = district?.trim() || null;
        if (upazila !== undefined) updateData.upazila = upazila?.trim() || null;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null;
        if (role !== undefined && isValidRole(role)) updateData.role = role as Role;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password.trim(), salt);
            updateData.plainPassword = password.trim();
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                userName: true,
                email: true,
                role: true,
                division: true,
                district: true,
                upazila: true,
                designation: true,
                isVerified: true,
                updatedAt: true,
            } as any,
        });

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updated,
        });
    } catch (error: any) {
        throw new AppError({ fnc: "updateUser", error });
    }
};
// UPDATE own profile (Authenticated users)
export const updateProfile = async (req: AppRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const {
            userName,
            phoneNumber,
            altPhoneNumber,
            designation,
        } = req.body;

        const file = req.file;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const updateData: any = {};
        if (userName !== undefined) updateData.userName = userName?.trim() || null;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber?.trim() || null;
        if (altPhoneNumber !== undefined) updateData.altPhoneNumber = altPhoneNumber?.trim() || null;
        if (designation !== undefined) updateData.designation = designation?.trim() || null;

        // Handle image upload
        if (file) {
            // Delete old image if it's not the default one
            const defaultImageUrl = "https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png";
            if (user.imageUrl && user.imageUrl !== defaultImageUrl) {
                try {
                    const parts = user.imageUrl.split('/');
                    const uploadIndex = parts.indexOf('upload');
                    if (uploadIndex !== -1) {
                        let publicIdParts = parts.slice(uploadIndex + 1);
                        if (publicIdParts[0].match(/^v\d+$/)) publicIdParts.shift();
                        const publicId = publicIdParts.join('/').split('.')[0];
                        await cloudinary.uploader.destroy(publicId);
                    }
                } catch (err) {
                    console.error(`❌ Old profile image deletion failed:`, err);
                }
            }
            updateData.imageUrl = (file as any).path;
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                userName: true,
                email: true,
                phoneNumber: true,
                altPhoneNumber: true,
                imageUrl: true,
                role: true,
                division: true,
                district: true,
                upazila: true,
                designation: true,
                isVerified: true,
                updatedAt: true,
            } as any,
        });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updated,
        });
    } catch (error: any) {
        throw new AppError({ fnc: "updateProfile", error });
    }
};

// CHANGE Password (Authenticated users)
export const changePassword = async (req: AppRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Old and new passwords are required" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect old password" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                plainPassword: newPassword.trim(), // Keep sync with your schema's visible field
            },
        });

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error: any) {
        throw new AppError({ fnc: "changePassword", error });
    }
};
