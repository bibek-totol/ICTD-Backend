"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const lab_controller_1 = require("../controllers/lab.controller");
// import authorizeMiddleware from "../middlewares/role.m";
// import authenticateMiddleware from "../middlewares/auth.m";
const router = express_1.default.Router();
router.get("/", lab_controller_1.newGetLabs);
router.get("/filter-options", lab_controller_1.getFilterOptions);
router.get("/:id", lab_controller_1.getLabById);
exports.default = router;
