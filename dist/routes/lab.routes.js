"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const lab_controller_js_1 = require("../controllers/lab.controller.js");
const labMulter_config_1 = require("../configs/labMulter.config");
const roleAuth_m_1 = require("../middlewares/roleAuth.m");
const router = express_1.default.Router();
// Bulk insert is public for migration
router.post("/add/bulk", lab_controller_js_1.bulkLabInsert);
// All other routes are protected
router.use(roleAuth_m_1.AuthorizationMiddleware);
router.get("/", lab_controller_js_1.getLabs);
router.get("/filter-options", lab_controller_js_1.getFilterOptions);
router.get("/unified-labs", lab_controller_js_1.getAllLabsUnified);
router.get("/:id", lab_controller_js_1.getLabById);
router.put("/update/:id", labMulter_config_1.labUpload.fields([{ name: 'labImages', maxCount: 2 }, { name: 'institutionImages', maxCount: 2 }]), lab_controller_js_1.updateLab);
exports.default = router;
