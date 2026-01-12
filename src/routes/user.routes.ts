import express, { Request, Response } from "express";
// import {
//   getUsers,
//   getUserDetails,
//   updateUser,
//   deleteUser,
// } from "../controllers/user.controller";
import authorizeMiddleware from "../middlewares/role.m";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import { AppError } from "../utils/AppError.util";


const router = express.Router();

// router.get("/", authorizeMiddleware, getUsers); // admin only

// router.get("/:userId", getUserDetails); // both

// router.put("/:userId", updateUser); // both

// router.delete("/:userId", authorizeMiddleware, deleteUser); // admin only

router.get("/", (req: Request, res: Response) => {
  try{
      return res.status(200).json({
    success: true,
    message: "welcome user",
  })

  }catch(error){

    const errorObj: AppErrorPayload = {
      fnc: "Any",
      error,
    }
    throw new AppError(errorObj)
  }

})

export default router;