"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const lab_controller_js_1 = require("../controllers/lab.controller.js");
const labMulter_config_1 = require("../configs/labMulter.config");
// import authorizeMiddleware from "../middlewares/role.m";
// import authenticateMiddleware from "../middlewares/auth.m";
const router = express_1.default.Router();
// router.get("/", newGetLabs);
router.get("/", lab_controller_js_1.getLabs);
router.get("/filter-options", lab_controller_js_1.getFilterOptions);
router.get("/:id", lab_controller_js_1.getLabById);
router.put("/update/:id", labMulter_config_1.labUpload.fields([{ name: 'labImages', maxCount: 2 }, { name: 'institutionImages', maxCount: 2 }]), lab_controller_js_1.updateLab);
exports.default = router;
