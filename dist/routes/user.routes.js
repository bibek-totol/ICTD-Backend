"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AppError_util_1 = require("../utils/AppError.util");
const env_config_1 = __importDefault(require("../configs/env.config"));
const prisma_config_1 = require("../configs/prisma.config");
const checkUserInput_utils_1 = require("../utils/checkUserInput.utils");
const roleAuth_m_1 = require("../middlewares/roleAuth.m");
const UserController = __importStar(require("../controllers/user.controller"));
const profileMulter_config_1 = require("../configs/profileMulter.config");
const router = express_1.default.Router();
// Bulk insert is public for migration
router.post("/add/bulk", UserController.bulkUserInsert);
// =========================================================
// User Self-Service Routes (Authenticated users)
// =========================================================
router.put("/profile", roleAuth_m_1.AuthorizationMiddleware, profileMulter_config_1.profileUpload.single("profilePicture"), UserController.updateProfile);
router.patch("/change-password", roleAuth_m_1.AuthorizationMiddleware, UserController.changePassword);
// =========================================================
// User Management Routes (SuperAdmin only)
// =========================================================
router.use(roleAuth_m_1.AuthorizationMiddleware);
// VERIFY/UNVERIFY ALL users (SuperAdmin only) - must be BEFORE :userId routes
router.patch("/manage/verify-all", roleAuth_m_1.SuperAdminAuthorizationMiddleware, UserController.verifyAllUsers);
// GET all users with passwords visible (SuperAdmin only)
router.get("/manage", roleAuth_m_1.SuperAdminAuthorizationMiddleware, UserController.getAllUsers);
// CREATE a new user (SuperAdmin only)
router.post("/manage", roleAuth_m_1.SuperAdminAuthorizationMiddleware, UserController.createUser);
// UPDATE a user (SuperAdmin only)
router.put("/manage/:userId", roleAuth_m_1.SuperAdminAuthorizationMiddleware, UserController.updateUser);
// DELETE a user (SuperAdmin only)
router.delete("/manage/:userId", roleAuth_m_1.SuperAdminAuthorizationMiddleware, UserController.deleteUser);
// VERIFY/UNVERIFY a single user (SuperAdmin only)
router.patch("/manage/:userId/verify", roleAuth_m_1.SuperAdminAuthorizationMiddleware, UserController.verifyUser);
// =========================================================
// Legacy Bulk Insert routes (used by import scripts)
// =========================================================
router.post("/add/users", async (req, res) => {
    try {
        if (!env_config_1.default.add_user_support) {
            return res.status(400).json({
                success: false,
                message: "Add Users Support is closed!",
            });
        }
        const { users, key } = req.body;
        if (!Array.isArray(users)) {
            return res.status(400).json({
                success: false,
                message: "users field must be an array",
            });
        }
        let allowedkeys = [
            "userName",
            "email",
            "password",
            "phoneNumber",
            "altPhoneNumber",
            "imageUrl",
            "role",
        ];
        for (let user of users) {
            let userKeys = Object.keys(user);
            user.userName = user?.head;
            delete user.head;
            user.phoneNumber = user?.mobile;
            delete user.mobile;
            user.altPhoneNumber = user?.alt_mobile;
            delete user.alt_mobile;
            user.email = user?.email;
            user.role = user?.role;
            let userKeysVerifySet = new Set(userKeys);
            for (let key of allowedkeys) {
                userKeysVerifySet.delete(key);
            }
            if (user?.userName) {
                if (typeof user.userName !== "string") {
                    return res.status(400).json({ success: false, message: "userName must be type string" });
                }
                let checkName = user.userName.toLowerCase().trim();
                if (checkName === "") {
                    return res.status(400).json({ success: false, message: "userName must be type string" });
                }
                user.userName = checkName;
            }
            if (user?.email) {
                if (typeof user.email !== "string") {
                    return res.status(400).json({ success: false, message: "email must be type string" });
                }
                let checkEmail = user.email.toLowerCase().trim();
                if (!(0, checkUserInput_utils_1.isEmail)(checkEmail)) {
                    return res.status(400).json({ success: false, message: "email must be type email" });
                }
                user.email = checkEmail;
            }
            if (user?.password) {
                if (typeof user.password !== "string") {
                    return res.status(400).json({ success: false, message: "password must be type string" });
                }
                let checkPassword = user.password.trim();
                if (checkPassword === "") {
                    return res.status(400).json({ success: false, message: "password must be not empty" });
                }
                user.password = checkPassword;
            }
            if (user?.phoneNumber) {
                if (typeof user.phoneNumber !== "string") {
                    return res.status(400).json({ success: false, message: "phoneNumber must be type string" });
                }
                let checkPhoneNumber = user.phoneNumber.trim();
                if (checkPhoneNumber === "") {
                    return res.status(400).json({ success: false, message: "phoneNumber should not empty" });
                }
                user.phoneNumber = checkPhoneNumber;
            }
            if (user?.role) {
                if (typeof user.role !== "string") {
                    return res.status(400).json({ success: false, message: "role must be type string" });
                }
                let checkRole = user.role.trim();
                if (!(0, checkUserInput_utils_1.isValidRole)(checkRole)) {
                    return res.status(400).json({ success: false, message: "role must be valid role type" });
                }
                user.role = checkRole;
            }
            let insertData = {
                email: user.email,
            };
            if (user?.userName)
                insertData.userName = user.userName;
            if (user?.password)
                insertData.password = user.password;
            if (user?.phoneNumber)
                insertData.phoneNumber = user.phoneNumber;
            if (user?.altPhoneNumber)
                insertData.altPhoneNumber = user.altPhoneNumber;
            if (user?.imageUrl)
                insertData.imageUrl = user.imageUrl;
            if (user?.role)
                insertData.role = user.role;
            const createUser = await prisma_config_1.prisma.user.create({ data: insertData });
        }
        return res.status(200).json({
            success: true,
            message: "welcome user hello",
            data: "data inserted successfully",
        });
    }
    catch (error) {
        const errorObj = { fnc: "Any", error };
        throw new AppError_util_1.AppError(errorObj);
    }
});
router.post("/add/labs", async (req, res) => {
    try {
        if (!env_config_1.default.add_user_support) {
            return res.status(400).json({
                success: false,
                message: "Add Labs Support is closed!",
            });
        }
        const { labs } = req.body;
        if (!Array.isArray(labs)) {
            return res.status(400).json({
                success: false,
                message: "labs field must be an array",
            });
        }
        for (let lab of labs) {
            const user = await prisma_config_1.prisma.user.findUnique({
                where: { email: lab.email },
            });
            if (!user)
                continue;
            let insertData = { userId: "" };
            if (!user.id)
                break;
            insertData.userId = user.id;
            if (lab?.division)
                insertData.division = lab.division;
            if (lab?.district)
                insertData.district = lab.district;
            if (lab?.seat)
                insertData.seat = lab.seat;
            if (lab?.upazila)
                insertData.upazila = lab.upazila;
            if (lab?.institute)
                insertData.institute = lab.institute;
            if (lab?.lab_type)
                insertData.lab_type = lab.lab_type;
            if (lab?.lat)
                insertData.lat = parseFloat(lab.lat);
            if (lab?.long)
                insertData.long = parseFloat(lab.long);
            const createLab = await prisma_config_1.prisma.labs.create({ data: insertData });
        }
        return res.status(200).json({
            success: true,
            message: "welcome lab hello",
            data: "data inserted successfully",
        });
    }
    catch (error) {
        const errorObj = { fnc: "Any", error };
        throw new AppError_util_1.AppError(errorObj);
    }
});
exports.default = router;
