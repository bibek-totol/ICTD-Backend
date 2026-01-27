import express from "express";
import { newGetLabs, getFilterOptions, getLabById, } from "../controllers/lab.controller";
// import authorizeMiddleware from "../middlewares/role.m";
// import authenticateMiddleware from "../middlewares/auth.m";
const router = express.Router();
router.get("/", newGetLabs);
router.get("/filter-options", getFilterOptions);
router.get("/:id", getLabById);
export default router;
