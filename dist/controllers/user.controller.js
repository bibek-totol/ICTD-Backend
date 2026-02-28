"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUserInsert = exports.changePassword = exports.updateProfile = exports.updateUser = exports.verifyAllUsers = exports.verifyUser = exports.deleteUser = exports.createUser = exports.getAllUsers = void 0;
const prisma_config_1 = require("../configs/prisma.config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const AppError_util_1 = require("../utils/AppError.util");
const checkUserInput_utils_1 = require("../utils/checkUserInput.utils");
const cloudinary_config_1 = __importDefault(require("../configs/cloudinary.config"));
// GET all users (SuperAdmin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_config_1.prisma.user.findMany({
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
            },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: users,
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "getAllUsers", error });
    }
};
exports.getAllUsers = getAllUsers;
// CREATE a new user (SuperAdmin only)
const createUser = async (req, res) => {
    try {
        let { userName, email, password, phoneNumber, altPhoneNumber, role, division, district, upazila, designation, imageUrl, } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        email = email.toLowerCase().trim();
        if (!(0, checkUserInput_utils_1.isEmail)(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }
        // Check if user already exists
        const existing = await prisma_config_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: "User already exists with this email" });
        }
        // Validate role
        if (role && !(0, checkUserInput_utils_1.isValidRole)(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }
        // Hash password
        const passwordToUse = password?.trim() || "govt@doict.pass";
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(passwordToUse, salt);
        const newUser = await prisma_config_1.prisma.user.create({
            data: {
                userName: userName?.trim() || null,
                email,
                password: hashedPassword,
                phoneNumber: phoneNumber?.trim() || null,
                altPhoneNumber: altPhoneNumber?.trim() || null,
                imageUrl: imageUrl?.trim() || "https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png",
                role: role || client_1.Role.LabAdmin,
                division: division?.trim() || null,
                district: district?.trim() || null,
                upazila: upazila?.trim() || null,
                designation: designation?.trim() || null,
                isVerified: false,
                pageState: "Default",
                plainPassword: password?.trim() || "govt@doict.pass",
            },
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
            },
        });
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: newUser,
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "createUser", error });
    }
};
exports.createUser = createUser;
// DELETE a user (SuperAdmin only)
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }
        const user = await prisma_config_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Prevent self-deletion
        if (user.id === req.user?.userId) {
            return res.status(400).json({ success: false, message: "Cannot delete your own account" });
        }
        // Prevent deleting SuperAdmin
        if (user.role === client_1.Role.SuperAdmin) {
            return res.status(403).json({ success: false, message: "Cannot delete a SuperAdmin" });
        }
        await prisma_config_1.prisma.user.delete({ where: { id: userId } });
        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "deleteUser", error });
    }
};
exports.deleteUser = deleteUser;
// VERIFY a single user (SuperAdmin only)
const verifyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isVerified, password } = req.body;
        if (typeof isVerified !== "boolean") {
            return res.status(400).json({ success: false, message: "isVerified must be boolean" });
        }
        const user = await prisma_config_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const updateData = {
            isVerified,
            pageState: isVerified ? "Registered" : "Default",
        };
        if (isVerified && password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            updateData.password = await bcryptjs_1.default.hash(password.trim(), salt);
            updateData.plainPassword = password.trim();
        }
        else if (!isVerified) {
            // Reset to default on unverify
            const salt = await bcryptjs_1.default.genSalt(10);
            updateData.password = await bcryptjs_1.default.hash("govt@doict.pass", salt);
            updateData.plainPassword = "govt@doict.pass";
        }
        const updatedUser = await prisma_config_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                userName: true,
                email: true,
                role: true,
                isVerified: true,
                plainPassword: true,
            },
        });
        return res.status(200).json({
            success: true,
            message: `User ${isVerified ? "verified" : "unverified"} successfully`,
            data: updatedUser,
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "verifyUser", error });
    }
};
exports.verifyUser = verifyUser;
// VERIFY ALL users at once (SuperAdmin only)
const verifyAllUsers = async (req, res) => {
    try {
        const { isVerified } = req.body;
        if (typeof isVerified !== "boolean") {
            return res.status(400).json({ success: false, message: "isVerified must be boolean" });
        }
        const updateData = {
            isVerified,
            pageState: isVerified ? "Registered" : "Default",
        };
        if (!isVerified) {
            const salt = await bcryptjs_1.default.genSalt(10);
            updateData.password = await bcryptjs_1.default.hash("govt@doict.pass", salt);
            updateData.plainPassword = "govt@doict.pass";
        }
        // Skip SuperAdmins when bulk changing
        const result = await prisma_config_1.prisma.user.updateMany({
            where: {
                role: { not: client_1.Role.SuperAdmin },
            },
            data: updateData,
        });
        return res.status(200).json({
            success: true,
            message: `${result.count} users ${isVerified ? "verified" : "unverified"} successfully`,
            count: result.count,
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "verifyAllUsers", error });
    }
};
exports.verifyAllUsers = verifyAllUsers;
// UPDATE user (SuperAdmin only)
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { userName, phoneNumber, altPhoneNumber, role, division, district, upazila, designation, imageUrl, password, } = req.body;
        const user = await prisma_config_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const updateData = {};
        if (userName !== undefined)
            updateData.userName = userName?.trim() || null;
        if (phoneNumber !== undefined)
            updateData.phoneNumber = phoneNumber?.trim() || null;
        if (altPhoneNumber !== undefined)
            updateData.altPhoneNumber = altPhoneNumber?.trim() || null;
        if (designation !== undefined)
            updateData.designation = designation?.trim() || null;
        if (division !== undefined)
            updateData.division = division?.trim() || null;
        if (district !== undefined)
            updateData.district = district?.trim() || null;
        if (upazila !== undefined)
            updateData.upazila = upazila?.trim() || null;
        if (imageUrl !== undefined)
            updateData.imageUrl = imageUrl?.trim() || null;
        if (role !== undefined && (0, checkUserInput_utils_1.isValidRole)(role))
            updateData.role = role;
        if (password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            updateData.password = await bcryptjs_1.default.hash(password.trim(), salt);
            updateData.plainPassword = password.trim();
        }
        const updated = await prisma_config_1.prisma.user.update({
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
            },
        });
        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updated,
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "updateUser", error });
    }
};
exports.updateUser = updateUser;
// UPDATE own profile (Authenticated users)
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { userName, phoneNumber, altPhoneNumber, designation, } = req.body;
        const file = req.file;
        const user = await prisma_config_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const updateData = {};
        if (userName !== undefined)
            updateData.userName = userName?.trim() || null;
        if (phoneNumber !== undefined)
            updateData.phoneNumber = phoneNumber?.trim() || null;
        if (altPhoneNumber !== undefined)
            updateData.altPhoneNumber = altPhoneNumber?.trim() || null;
        if (designation !== undefined)
            updateData.designation = designation?.trim() || null;
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
                        if (publicIdParts[0].match(/^v\d+$/))
                            publicIdParts.shift();
                        const publicId = publicIdParts.join('/').split('.')[0];
                        await cloudinary_config_1.default.uploader.destroy(publicId);
                    }
                }
                catch (err) {
                    console.error(`❌ Old profile image deletion failed:`, err);
                }
            }
            updateData.imageUrl = file.path;
        }
        const updated = await prisma_config_1.prisma.user.update({
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
            },
        });
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updated,
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "updateProfile", error });
    }
};
exports.updateProfile = updateProfile;
// CHANGE Password (Authenticated users)
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Old and new passwords are required" });
        }
        const user = await prisma_config_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Verify old password
        const isMatch = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect old password" });
        }
        // Hash new password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(newPassword.trim(), salt);
        await prisma_config_1.prisma.user.update({
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
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "changePassword", error });
    }
};
exports.changePassword = changePassword;
const bulkUserInsert = async (req, res) => {
    try {
        const { users } = req.body;
        if (!Array.isArray(users)) {
            return res.status(400).json({
                success: false,
                message: "users field must be an array",
            });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const usersToInsert = [];
        for (const user of users) {
            const email = user.email?.toLowerCase().trim();
            if (!email || !(0, checkUserInput_utils_1.isEmail)(email))
                continue;
            const passwordToUse = user.password?.trim() || "govt@doict.pass";
            const hashedPassword = await bcryptjs_1.default.hash(passwordToUse, salt);
            usersToInsert.push({
                userName: user.head?.trim() || user.userName?.trim() || null,
                email: email,
                password: hashedPassword,
                plainPassword: passwordToUse,
                phoneNumber: user.mobile ? String(user.mobile) : (user.phoneNumber ? String(user.phoneNumber) : null),
                altPhoneNumber: user.alt_mobile ? String(user.alt_mobile) : (user.altPhoneNumber ? String(user.altPhoneNumber) : null),
                role: (user.role && (0, checkUserInput_utils_1.isValidRole)(user.role)) ? user.role : client_1.Role.LabAdmin,
                isVerified: true,
                pageState: "Registered",
            });
        }
        const result = await prisma_config_1.prisma.user.createMany({
            data: usersToInsert,
            skipDuplicates: true,
        });
        return res.status(201).json({
            success: true,
            message: `${result.count} users inserted successfully`,
            data: result,
        });
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "bulkUserInsert", error });
    }
};
exports.bulkUserInsert = bulkUserInsert;
