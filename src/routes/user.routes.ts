import express, { Request, Response } from "express";
// import {
//   getUsers,
//   getUserDetails,
//   updateUser,
//   deleteUser,
// } from "../controllers/user.controller";
// import authorizeMiddleware from "../middlewares/roleAuth.m";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import { AppError } from "../utils/AppError.util";
import config from "../configs/env.config";
import { prisma } from "../configs/prisma.config";
import { Role } from "@prisma/client";
import { isEmail, isValidRole } from "../utils/checkUserInput.utils";
import { AuthorizationMiddleware } from "../middlewares/roleAuth.m";
import { uploadToDBFromExcelUserSheet } from "../scripts/importUsersFromExcel";
import { LabTypes } from "@prisma/client";

const router = express.Router();

// router.get("/", authorizeMiddleware, getUsers); // admin only

// router.get("/:userId", getUserDetails); // both

// router.put("/:userId", updateUser); // both

// router.delete("/:userId", authorizeMiddleware, deleteUser); // admin only

// router.use(AuthorizationMiddleware);

router.get("/", (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      message: "welcome user",
    });
  } catch (error) {
    const errorObj: AppErrorPayload = {
      fnc: "Any",
      error,
    };
    throw new AppError(errorObj);
  }
});

router.post("/add/users", async (req: Request, res: Response) => {
  try {
    if (!config.add_user_support) {
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

    // if (!key) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "key field is missing",
    //   });
    // }

    // implement the middleware
    // catch the role and id from middleware
    // implement the key validate with checking usersManagementKey keys

    let allowedkeys: string[] = [
      "userName",
      "email",
      "password",
      "phoneNumber",
      "altPhoneNumber",
      "imageUrl",
      "role",
    ];

    for (let user of users) {
      console.log(Object.keys(user));

      let userKeys = Object.keys(user);

      user.userName = user?.head;
      delete user.head;
      user.phoneNumber = user?.mobile;
      delete user.mobile;
      user.altPhoneNumber = user?.alt_mobile;
      delete user.alt_mobile;

      user.email = user?.email;
      user.role = user?.role;

      // if (userKeys.length > 8) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "limit exceded for user fields",
      //   });
      // }

      let userKeysVerifySet = new Set(userKeys);

      console.log("First remains => ", userKeysVerifySet);
      for (let key of allowedkeys) {
        userKeysVerifySet.delete(key);
        console.log("remains => ", userKeysVerifySet);
      }
      console.log("remains size of userKeysVerifySet", userKeysVerifySet.size);

      // if (userKeysVerifySet.size !== 0) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "invalid add user total fields",
      //   });
      // }

      if (user?.userName) {
        if (typeof user.userName !== "string") {
          return res.status(400).json({
            success: false,
            message: "userName must be type string",
          });
        }
        let checkName = user.userName.toLowerCase().trim();

        if (checkName === "") {
          return res.status(400).json({
            success: false,
            message: "userName must be type string",
          });
        }
        user.userName = checkName;
      }

      if (user?.email) {
        if (typeof user.email !== "string") {
          return res.status(400).json({
            success: false,
            message: "email must be type string",
          });
        }

        let checkEmail = user.email.toLowerCase().trim();

        if (!isEmail(checkEmail)) {
          return res.status(400).json({
            success: false,
            message: "email must be type email",
          });
        }

        user.email = checkEmail;
      }

      if (user?.password) {
        if (typeof user.password !== "string") {
          return res.status(400).json({
            success: false,
            message: "password must be type string",
          });
        }

        let checkPassword = user.password.trim();

        if (checkPassword === "") {
          return res.status(400).json({
            success: false,
            message: "password must be not empty",
          });
        }
        user.password = checkPassword;
      }

      if (user?.phoneNumber) {
        if (typeof user.phoneNumber !== "string") {
          return res.status(400).json({
            success: false,
            message: "phoneNumber must be type string",
          });
        }
        let checkPhoneNumber = user.phoneNumber.trim();

        if (checkPhoneNumber === "") {
          return res.status(400).json({
            success: false,
            message: "phoneNumber should not empty",
          });
        }
        user.phoneNumber = checkPhoneNumber;
      }

      if (user?.role) {
        if (typeof user.role !== "string") {
          return res.status(400).json({
            success: false,
            message: "role must be type string",
          });
        }
        let checkRole = user.role.trim();

        if (!isValidRole(checkRole)) {
          return res.status(400).json({
            success: false,
            message: "role must be valid role type",
          });
        }
        user.role = checkRole;
      }

      // "userName",
      // "email",
      // "password",
      // "phoneNumber",
      // "altPhoneNumber",
      // "imageUrl",
      // "role",

      let insertData: {
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

      if (user?.userName) {
        insertData.userName = user.userName;
      }

      if (user?.password) {
        insertData.password = user.password;
      }

      if (user?.phoneNumber) {
        insertData.phoneNumber = user.phoneNumber;
      }

      if (user?.altPhoneNumber) {
        insertData.altPhoneNumber = user.altPhoneNumber;
      }

      if (user?.imageUrl) {
        insertData.imageUrl = user.imageUrl;
      }

      if (user?.role) {
        insertData.role = user.role;
      }

      const createUser = await prisma.user.create({
        data: insertData,
      });
    }

    // console.log(" Array.isArray(users) => ", Array.isArray(users));

    // console.log("users ==>", users);

    return res.status(200).json({
      success: true,
      message: "welcome user hello",
      data: "data inserted successfully",
    });
  } catch (error) {
    const errorObj: AppErrorPayload = {
      fnc: "Any",
      error,
    };
    throw new AppError(errorObj);
  }
});

router.post("/add/labs", async (req: Request, res: Response) => {
  try {
    if (!config.add_user_support) {
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
      const user = await prisma.user.findUnique({
        where: {
          email: lab.email,
        },
      });

      if (!user) {
        continue;
      }

      let insertData: {
        division?: string;
        seat?: string;
        upazila?: string;
        institute?: string;
        lab_type?: LabTypes;
        userId: string;
        lat?: string;
        long?: Role;
      } = {
        userId: "",
      };

      if (!user.id) {
        break;
      }

      insertData.userId = user.id;

      if (lab?.division) {
        insertData.division = lab.division;
      }

      if (lab?.seat) {
        insertData.seat = lab.seat;
      }

      if (lab?.upazila) {
        insertData.upazila = lab.upazila;
      }

      if (lab?.institute) {
        insertData.institute = lab.institute;
      }

      if (lab?.lab_type) {
        insertData.lab_type = lab.lab_type;
      }

      if (lab?.lat) {
        insertData.lat = lab.lat;
      }

      if (lab?.long) {
        insertData.long = lab.long;
      }

      const createLab = await prisma.labs.create({
        data: insertData,
      });
    }

    return res.status(200).json({
      success: true,
      message: "welcome lab hello",
      data: "data inserted successfully",
    });
  } catch (error) {
    const errorObj: AppErrorPayload = {
      fnc: "Any",
      error,
    };
    throw new AppError(errorObj);
  }
});

export default router;
