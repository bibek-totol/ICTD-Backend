import express, { Request, Response } from 'express';
import { AppErrorPayload } from '../interfaces_and_types/AppError.interface';
import { AppError } from '../utils/AppError.util';
import config from '../configs/env.config';
import { prisma } from '../configs/prisma.config';
import { Role } from '@prisma/client';
import { isEmail, isValidRole } from '../utils/checkUserInput.utils';
import {
  AuthorizationMiddleware,
  SuperAdminAuthorizationMiddleware,
} from '../middlewares/roleAuth.m';
import { LabTypes } from '@prisma/client';
import * as UserController from '../controllers/user.controller';
import { profileUpload } from '../configs/profileMulter.config';

const router = express.Router();

// Bulk insert is public for migration
router.post('/add/bulk', UserController.bulkUserInsert);

// =========================================================
// User Self-Service Routes (Authenticated users)
// =========================================================
router.put(
  '/profile',
  AuthorizationMiddleware,
  profileUpload.single('profilePicture'),
  UserController.updateProfile,
);
router.patch('/change-password', AuthorizationMiddleware, UserController.changePassword);

// =========================================================
// User Management Routes (SuperAdmin only)
// =========================================================
router.use(AuthorizationMiddleware);

// VERIFY/UNVERIFY ALL users (SuperAdmin only) - must be BEFORE :userId routes
router.patch(
  '/manage/verify-all',
  SuperAdminAuthorizationMiddleware,
  UserController.verifyAllUsers,
);

// GET all users with passwords visible (SuperAdmin only)
router.get('/manage', SuperAdminAuthorizationMiddleware, UserController.getAllUsers);

// CREATE a new user (SuperAdmin only)
router.post('/manage', SuperAdminAuthorizationMiddleware, UserController.createUser);

// UPDATE a user (SuperAdmin only)
router.put('/manage/:userId', SuperAdminAuthorizationMiddleware, UserController.updateUser);

// DELETE a user (SuperAdmin only)
router.delete('/manage/:userId', SuperAdminAuthorizationMiddleware, UserController.deleteUser);

// VERIFY/UNVERIFY a single user (SuperAdmin only)
router.patch(
  '/manage/:userId/verify',
  SuperAdminAuthorizationMiddleware,
  UserController.verifyUser,
);

// =========================================================
// Legacy Bulk Insert routes (used by import scripts)
// =========================================================
router.post('/add/users', async (req: Request, res: Response) => {
  try {
    if (!config.add_user_support) {
      return res.status(400).json({
        success: false,
        message: 'Add Users Support is closed!',
      });
    }

    const { users } = req.body;

    if (!Array.isArray(users)) {
      return res.status(400).json({
        success: false,
        message: 'users field must be an array',
      });
    }

    const allowedkeys: string[] = [
      'userName',
      'email',
      'password',
      'phoneNumber',
      'altPhoneNumber',
      'imageUrl',
      'role',
    ];

    for (const user of users) {
      const userKeys = Object.keys(user);

      user.userName = user?.head;
      delete user.head;
      user.phoneNumber = user?.mobile;
      delete user.mobile;
      user.altPhoneNumber = user?.alt_mobile;
      delete user.alt_mobile;

      const userKeysVerifySet = new Set(userKeys);
      for (const key of allowedkeys) {
        userKeysVerifySet.delete(key);
      }

      if (user?.userName) {
        if (typeof user.userName !== 'string') {
          return res.status(400).json({ success: false, message: 'userName must be type string' });
        }
        const checkName = user.userName.toLowerCase().trim();
        if (checkName === '') {
          return res.status(400).json({ success: false, message: 'userName must be type string' });
        }
        user.userName = checkName;
      }

      if (user?.email) {
        if (typeof user.email !== 'string') {
          return res.status(400).json({ success: false, message: 'email must be type string' });
        }
        const checkEmail = user.email.toLowerCase().trim();
        if (!isEmail(checkEmail)) {
          return res.status(400).json({ success: false, message: 'email must be type email' });
        }
        user.email = checkEmail;
      }

      if (user?.password) {
        if (typeof user.password !== 'string') {
          return res.status(400).json({ success: false, message: 'password must be type string' });
        }
        const checkPassword = user.password.trim();
        if (checkPassword === '') {
          return res.status(400).json({ success: false, message: 'password must be not empty' });
        }
        user.password = checkPassword;
      }

      if (user?.phoneNumber) {
        if (typeof user.phoneNumber !== 'string') {
          return res
            .status(400)
            .json({ success: false, message: 'phoneNumber must be type string' });
        }
        const checkPhoneNumber = user.phoneNumber.trim();
        if (checkPhoneNumber === '') {
          return res.status(400).json({ success: false, message: 'phoneNumber should not empty' });
        }
        user.phoneNumber = checkPhoneNumber;
      }

      if (user?.role) {
        if (typeof user.role !== 'string') {
          return res.status(400).json({ success: false, message: 'role must be type string' });
        }
        const checkRole = user.role.trim();
        if (!isValidRole(checkRole)) {
          return res.status(400).json({ success: false, message: 'role must be valid role type' });
        }
        user.role = checkRole;
      }

      const insertData: {
        userName?: string;
        email: string;
        password?: string;
        phoneNumber?: string;
        altPhoneNumber?: string;
        imageUrl?: string;
        role?: Role;
      } = {
        email: user.email,
      };

      if (user?.userName) insertData.userName = user.userName;
      if (user?.password) insertData.password = user.password;
      if (user?.phoneNumber) insertData.phoneNumber = user.phoneNumber;
      if (user?.altPhoneNumber) insertData.altPhoneNumber = user.altPhoneNumber;
      if (user?.imageUrl) insertData.imageUrl = user.imageUrl;
      if (user?.role) insertData.role = user.role;

      const createUser = await prisma.user.create({ data: insertData });
    }

    return res.status(200).json({
      success: true,
      message: 'welcome user hello',
      data: 'data inserted successfully',
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'Any', error };
    throw new AppError(errorObj);
  }
});

router.post('/add/labs', async (req: Request, res: Response) => {
  try {
    if (!config.add_user_support) {
      return res.status(400).json({
        success: false,
        message: 'Add Labs Support is closed!',
      });
    }

    const { labs } = req.body;

    if (!Array.isArray(labs)) {
      return res.status(400).json({
        success: false,
        message: 'labs field must be an array',
      });
    }

    for (const lab of labs) {
      const user = await prisma.user.findUnique({
        where: { email: lab.email },
      });

      if (!user) continue;

      const insertData: {
        division?: string;
        district?: string;
        seat?: string;
        upazila?: string;
        institute?: string;
        lab_type?: LabTypes;
        userId: string;
        lat?: number;
        long?: number;
      } = { userId: '' };

      if (!user.id) break;
      insertData.userId = user.id;

      if (lab?.division) insertData.division = lab.division;
      if (lab?.district) insertData.district = lab.district;
      if (lab?.seat) insertData.seat = lab.seat;
      if (lab?.upazila) insertData.upazila = lab.upazila;
      if (lab?.institute) insertData.institute = lab.institute;
      if (lab?.lab_type) insertData.lab_type = lab.lab_type;
      if (lab?.lat) insertData.lat = parseFloat(lab.lat);
      if (lab?.long) insertData.long = parseFloat(lab.long);

      const createLab = await prisma.labs.create({ data: insertData });
    }

    return res.status(200).json({
      success: true,
      message: 'welcome lab hello',
      data: 'data inserted successfully',
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'Any', error };
    throw new AppError(errorObj);
  }
});

export default router;
