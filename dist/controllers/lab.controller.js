"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkLabInsert = exports.getAllLabsUnified = exports.updateLab = exports.getFilterOptions = exports.getLabById = exports.getLabs = void 0;
const prisma_config_1 = require("../configs/prisma.config");
const AppError_util_1 = require("../utils/AppError.util");
const client_1 = require("@prisma/client");
const cloudinary_config_1 = __importDefault(require("../configs/cloudinary.config"));
const jurisdiction_util_1 = require("../utils/jurisdiction.util");
const mapLabToFrontend = (lab) => ({
    id: lab.id,
    institute: lab.institute,
    division: lab.division,
    district: lab.district,
    upazila: lab.upazila,
    seat: lab.seat,
    head: lab.user?.userName ?? lab.head,
    mobile: lab.user?.phoneNumber ?? lab.mobile,
    altMobile: lab.altPhoneNumber ?? lab.alt_mobile,
    email: lab.user?.email ?? lab.email,
    labType: lab.lab_type,
    lat: lab.lat,
    long: lab.long,
    labImages: lab.labImages ?? [],
    institutionImages: lab.institutionImages ?? [],
});
const getLabs = async (req, res) => {
    try {
        const { division, district, upazila, labType, search } = req.query;
        const user = req.user;
        const whereClause = {};
        // Professional Scoping & Language Normalization
        if (user?.role !== "SuperAdmin") {
            if (user?.role === "DistrictAdmin") {
                if (user.district) {
                    whereClause.district = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(user.district) };
                }
            }
            else if (user?.role === "DivisionAdmin") {
                if (user.division) {
                    whereClause.division = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(user.division) };
                }
            }
            else if (user?.role === "LabAdmin") {
                if (user.email) {
                    whereClause.email = user.email;
                }
                else {
                    // If no email, they see nothing (safety)
                    whereClause.id = -1;
                }
            }
            else {
                // More specific roles (Upazila/etc)
                if (user?.division)
                    whereClause.division = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(user.division) };
                if (user?.district)
                    whereClause.district = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(user.district) };
                if (user?.upazila)
                    whereClause.upazila = user.upazila;
            }
        }
        // Secondary Filters (Query params)
        if (division && division !== "All") {
            const normalized = (0, jurisdiction_util_1.normalizeJurisdiction)(division);
            whereClause.division = { in: normalized };
        }
        if (district && district !== "All") {
            const normalized = (0, jurisdiction_util_1.normalizeJurisdiction)(district);
            whereClause.district = { in: normalized };
        }
        if (upazila && upazila !== "All") {
            whereClause.upazila = upazila;
        }
        if (labType && labType !== "All") {
            whereClause.lab_type = labType;
        }
        if (search) {
            whereClause.OR = [
                { institute: { contains: search, mode: "insensitive" } },
                { head: { contains: search, mode: "insensitive" } },
                { user: { userName: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { user: { phoneNumber: { contains: search, mode: "insensitive" } } },
                { division: { contains: search, mode: "insensitive" } },
                { district: { contains: search, mode: "insensitive" } },
            ];
        }
        const labs = await prisma_config_1.prisma.labs.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        userName: true,
                        email: true,
                        phoneNumber: true,
                        altPhoneNumber: true,
                    },
                },
            },
            orderBy: {
                id: "asc",
            },
        });
        const mappedLabs = labs.map(mapLabToFrontend);
        return res.status(200).json({
            success: true,
            message: "Labs retrieved successfully",
            data: mappedLabs,
            count: mappedLabs.length,
        });
    }
    catch (error) {
        const errorObj = {
            fnc: "getLabs",
            error,
        };
        throw new AppError_util_1.AppError(errorObj);
    }
};
exports.getLabs = getLabs;
const getLabById = async (req, res) => {
    try {
        const { id } = req.params;
        const lab = await prisma_config_1.prisma.labs.findUnique({
            where: {
                id: parseInt(id),
            },
            include: {
                user: {
                    select: {
                        userName: true,
                        email: true,
                        phoneNumber: true,
                        altPhoneNumber: true,
                    },
                },
            },
        });
        if (!lab) {
            return res.status(404).json({
                success: false,
                message: "Lab not found",
            });
        }
        // Jurisdiction & Role Check
        const userAuth = req.user;
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.role === "LabAdmin") {
                if (lab.email !== userAuth.email) {
                    return res.status(403).json({ success: false, message: "Access denied: this is not your lab" });
                }
            }
            else {
                const normalizedDiv = userAuth?.division ? (0, jurisdiction_util_1.normalizeJurisdiction)(userAuth.division) : [];
                const normalizedDist = userAuth?.district ? (0, jurisdiction_util_1.normalizeJurisdiction)(userAuth.district) : [];
                if (userAuth?.division && !normalizedDiv.includes(lab.division || "")) {
                    return res.status(403).json({ success: false, message: "Access denied: outside your division" });
                }
                if (userAuth?.district && !normalizedDist.includes(lab.district || "")) {
                    return res.status(403).json({ success: false, message: "Access denied: outside your district" });
                }
                if (userAuth?.upazila && lab.upazila !== userAuth.upazila) {
                    return res.status(403).json({ success: false, message: "Access denied: outside your upazila" });
                }
            }
        }
        const mappedLab = mapLabToFrontend(lab);
        return res.status(200).json({
            success: true,
            message: "Lab retrieved successfully",
            data: mappedLab,
        });
    }
    catch (error) {
        const errorObj = {
            fnc: "getLabById",
            error,
        };
        throw new AppError_util_1.AppError(errorObj);
    }
};
exports.getLabById = getLabById;
const getFilterOptions = async (req, res) => {
    try {
        const user = req.user;
        const where = {};
        if (user?.role !== "SuperAdmin") {
            if (user?.role === "DistrictAdmin" && user.district) {
                where.district = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(user.district) };
            }
            else if (user?.role === "DivisionAdmin" && user.division) {
                where.division = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(user.division) };
            }
            else if (user?.role === "LabAdmin") {
                if (user.email) {
                    where.email = user.email;
                }
                else {
                    where.id = -1;
                }
            }
            else {
                if (user?.division)
                    where.division = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(user.division) };
                if (user?.district)
                    where.district = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(user.district) };
                if (user?.upazila)
                    where.upazila = user.upazila;
            }
        }
        const divisions = await prisma_config_1.prisma.labs.findMany({
            distinct: ["division"],
            select: { division: true },
            where: { ...where, division: { not: null, notIn: ["", " "] } },
            orderBy: { division: "asc" },
        });
        const districts = await prisma_config_1.prisma.labs.findMany({
            distinct: ["district"],
            select: { district: true },
            where: { ...where, district: { not: null, notIn: ["", " "] } },
            orderBy: { district: "asc" },
        });
        const upazilas = await prisma_config_1.prisma.labs.findMany({
            distinct: ["upazila"],
            select: { upazila: true },
            where: { ...where, upazila: { not: null, notIn: ["", " "] } },
            orderBy: { upazila: "asc" },
        });
        const labTypes = await prisma_config_1.prisma.labs.findMany({
            distinct: ["lab_type"],
            select: { lab_type: true },
            where: { ...where, lab_type: { not: null } },
            orderBy: { lab_type: "asc" },
        });
        return res.status(200).json({
            success: true,
            message: "Filter options retrieved successfully",
            data: {
                divisions: divisions.map((d) => d.division).filter(Boolean),
                districts: districts.map((d) => d.district).filter(Boolean),
                upazilas: upazilas.map((u) => u.upazila).filter(Boolean),
                labTypes: labTypes.map((l) => l.lab_type).filter(Boolean),
            },
        });
    }
    catch (error) {
        const errorObj = {
            fnc: "getFilterOptions",
            error,
        };
        throw new AppError_util_1.AppError(errorObj);
    }
};
exports.getFilterOptions = getFilterOptions;
const updateLab = async (req, res) => {
    try {
        const { id } = req.params;
        const { division, district, upazila, seat, head, email, mobile, alt_mobile, lat, long, deletedImages } = req.body;
        const files = req.files;
        const labId = parseInt(id);
        // Find the lab first
        const lab = await prisma_config_1.prisma.labs.findUnique({
            where: { id: labId },
            include: { user: true },
        });
        if (!lab) {
            return res.status(404).json({
                success: false,
                message: "Lab not found",
            });
        }
        // Jurisdiction & Role Check
        const userAuth = req.user;
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.role === "LabAdmin") {
                if (lab.email !== userAuth.email) {
                    return res.status(403).json({ success: false, message: "Access denied: this is not your lab" });
                }
            }
            else if (userAuth?.role === "DistrictAdmin") {
                const normalizedDist = userAuth.district ? (0, jurisdiction_util_1.normalizeJurisdiction)(userAuth.district) : [];
                if (!normalizedDist.includes(lab.district || "")) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your district" });
                }
            }
            else {
                const normalizedDiv = userAuth?.division ? (0, jurisdiction_util_1.normalizeJurisdiction)(userAuth.division) : [];
                const normalizedDist = userAuth?.district ? (0, jurisdiction_util_1.normalizeJurisdiction)(userAuth.district) : [];
                if (userAuth?.division && !normalizedDiv.includes(lab.division || "")) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your division" });
                }
                if (userAuth?.district && !normalizedDist.includes(lab.district || "")) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your district" });
                }
                if (userAuth?.upazila && lab.upazila !== userAuth.upazila) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your upazila" });
                }
            }
        }
        // Helper to consolidate images (exact logic from ictdl.controller.ts)
        const getImages = (fieldName) => {
            const hasFiles = files && files[fieldName] && files[fieldName].length > 0;
            const hasBody = req.body[fieldName] !== undefined;
            if (!hasFiles && !hasBody)
                return undefined;
            let rawImages = [];
            const bodyValue = req.body[fieldName];
            if (bodyValue) {
                const processValue = (val) => {
                    if (typeof val === "string") {
                        const trimmed = val.trim();
                        if (trimmed === "")
                            return;
                        const parts = trimmed.split(",").map(p => p.trim()).filter(p => p !== "");
                        rawImages = [...rawImages, ...parts];
                    }
                };
                if (Array.isArray(bodyValue)) {
                    bodyValue.forEach(processValue);
                }
                else {
                    processValue(bodyValue);
                }
            }
            if (hasFiles) {
                const uploadedUrls = files[fieldName].map((file) => file.path);
                rawImages = [...rawImages, ...uploadedUrls];
            }
            const cleanedImages = [...new Set(rawImages)].filter(img => typeof img === "string" && img !== "");
            return cleanedImages.slice(0, 2);
        };
        const labImages = getImages('labImages');
        const institutionImages = getImages('institutionImages');
        // Handle Cloudinary deletions (exact logic from ictdl.controller.ts)
        if (deletedImages) {
            try {
                let imagesToDelete = [];
                if (typeof deletedImages === 'string') {
                    imagesToDelete = JSON.parse(deletedImages);
                }
                else if (Array.isArray(deletedImages)) {
                    imagesToDelete = deletedImages;
                }
                const existingImages = new Set([
                    ...(lab.labImages || []),
                    ...(lab.institutionImages || [])
                ]);
                for (const imageUrl of imagesToDelete) {
                    if (!existingImages.has(imageUrl))
                        continue;
                    if (labImages?.includes(imageUrl) || institutionImages?.includes(imageUrl))
                        continue;
                    try {
                        const parts = imageUrl.split('/');
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
                        console.error(`❌ Cloudinary deletion failed for ${imageUrl}:`, err);
                    }
                }
            }
            catch (e) {
                console.error("❌ Error processing deletedImages:", e);
            }
        }
        // Update with Transaction
        const updatedLab = await prisma_config_1.prisma.$transaction(async (tx) => {
            // 1. Update Related User record
            const userUpdateData = {};
            if (head !== undefined)
                userUpdateData.userName = head;
            if (email !== undefined)
                userUpdateData.email = email;
            if (mobile !== undefined)
                userUpdateData.phoneNumber = mobile;
            if (alt_mobile !== undefined)
                userUpdateData.altPhoneNumber = alt_mobile;
            if (Object.keys(userUpdateData).length > 0 && lab.userId) {
                await tx.user.update({
                    where: { id: lab.userId },
                    data: userUpdateData,
                });
            }
            // 2. Update Lab record
            const labUpdateData = {};
            // Only SuperAdmin can change jurisdiction
            if (userAuth?.role === "SuperAdmin") {
                if (division !== undefined)
                    labUpdateData.division = division;
                if (district !== undefined)
                    labUpdateData.district = district;
                if (upazila !== undefined)
                    labUpdateData.upazila = upazila;
            }
            if (seat !== undefined)
                labUpdateData.seat = seat;
            if (lat !== undefined)
                labUpdateData.lat = parseFloat(lat);
            if (long !== undefined)
                labUpdateData.long = parseFloat(long);
            if (labImages !== undefined)
                labUpdateData.labImages = labImages;
            if (institutionImages !== undefined)
                labUpdateData.institutionImages = institutionImages;
            return await tx.labs.update({
                where: { id: labId },
                data: labUpdateData,
                include: {
                    user: {
                        select: {
                            userName: true,
                            email: true,
                            phoneNumber: true,
                            altPhoneNumber: true,
                        },
                    },
                },
            });
        });
        const mappedLab = mapLabToFrontend(updatedLab);
        return res.status(200).json({
            success: true,
            message: "Lab updated successfully",
            data: mappedLab,
        });
    }
    catch (error) {
        console.error("❌ Error in updateLab:", error);
        const errorObj = {
            fnc: "updateLab",
            error,
        };
        throw new AppError_util_1.AppError(errorObj);
    }
};
exports.updateLab = updateLab;
const getAllLabsUnified = async (req, res) => {
    try {
        const userAuth = req.user;
        const where = {};
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.role === "DistrictAdmin") {
                if (userAuth.district)
                    where.district = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(userAuth.district) };
            }
            else if (userAuth?.role === "DivisionAdmin") {
                if (userAuth.division)
                    where.division = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(userAuth.division) };
            }
            else if (userAuth?.role === "LabAdmin") {
                if (userAuth.email) {
                    where.email = userAuth.email;
                }
                else {
                    where.id = -1;
                }
            }
            else {
                if (userAuth?.division)
                    where.division = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(userAuth.division) };
                if (userAuth?.district)
                    where.district = { in: (0, jurisdiction_util_1.normalizeJurisdiction)(userAuth.district) };
                if (userAuth?.upazila)
                    where.upazila = userAuth.upazila;
            }
        }
        const labs = await prisma_config_1.prisma.labs.findMany({
            where,
            select: {
                id: true,
                institute: true,
                division: true,
                district: true,
                upazila: true,
            },
        });
        const ictdlLabs = await prisma_config_1.prisma.ictdl_labs.findMany({
            where,
            select: {
                id: true,
                institute: true,
                division: true,
                district: true,
                upazila: true,
            },
        });
        const unifiedLabs = [
            ...labs.map((l) => ({
                id: `lab-${l.id}`,
                institute: l.institute || "",
                division: l.division || "",
                district: l.district || "",
                upazila: l.upazila || "",
                type: "SRD/SOF",
            })),
            ...ictdlLabs.map((l) => ({
                id: `ictdl-${l.id}`,
                institute: l.institute || "",
                division: l.division || "",
                district: l.district || "",
                upazila: l.upazila || "",
                type: "ICTDL",
            })),
        ];
        return res.status(200).json({
            success: true,
            message: "Unified labs retrieved successfully",
            data: unifiedLabs,
        });
    }
    catch (error) {
        const errorObj = {
            fnc: "getAllLabsUnified",
            error,
        };
        throw new AppError_util_1.AppError(errorObj);
    }
};
exports.getAllLabsUnified = getAllLabsUnified;
const bulkLabInsert = async (req, res) => {
    try {
        const { labs } = req.body;
        if (!Array.isArray(labs)) {
            return res.status(400).json({
                success: false,
                message: "labs field must be an array",
            });
        }
        const labsToInsert = labs.map((lab) => ({
            division: lab.division || null,
            district: lab.district || null,
            seat: lab.seat || null,
            upazila: lab.upazila || null,
            institute: lab.institute || null,
            lab_type: lab.lab_type || client_1.LabTypes.sof,
            head: lab.head || null,
            mobile: lab.mobile ? String(lab.mobile) : null,
            alt_mobile: lab.alt_mobile ? String(lab.alt_mobile) : null,
            email: lab.email || null,
            lat: parseFloat(lab.lat) || 0,
            long: parseFloat(lab.long) || 0,
            labImages: [],
            institutionImages: [],
        }));
        const result = await prisma_config_1.prisma.labs.createMany({
            data: labsToInsert,
            skipDuplicates: true,
        });
        return res.status(201).json({
            success: true,
            message: `${result.count} labs inserted successfully`,
            data: result,
        });
    }
    catch (error) {
        const errorObj = {
            fnc: "bulkLabInsert",
            error,
        };
        throw new AppError_util_1.AppError(errorObj);
    }
};
exports.bulkLabInsert = bulkLabInsert;
