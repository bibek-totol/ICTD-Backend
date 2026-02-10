"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLab = exports.newGetLabs = exports.getFilterOptions = exports.getLabById = exports.getLabs = void 0;
const prisma_config_1 = require("../configs/prisma.config");
const AppError_util_1 = require("../utils/AppError.util");
const labs_interface_1 = require("../interfaces_and_types/labs.interface");
const cloudinary_config_1 = __importDefault(require("../configs/cloudinary.config"));
const mapLabToFrontend = (lab) => ({
    id: lab.id,
    institute: lab.institute,
    division: lab.division,
    upazila: lab.upazila,
    seat: lab.seat,
    head: lab.user?.userName ?? lab.head,
    mobile: lab.user?.phoneNumber ?? lab.mobile,
    altMobile: lab.user?.altPhoneNumber ?? lab.alt_mobile,
    email: lab.user?.email ?? lab.email,
    labType: lab.lab_type,
    lat: lab.lat,
    long: lab.long,
    labImages: lab.labImages ?? [],
    institutionImages: lab.institutionImages ?? [],
});
const getLabs = async (req, res) => {
    try {
        console.log("🔍 getLabs called with query:", req.query);
        const { division, upazila, labType, search } = req.query;
        const whereClause = {};
        if (division && division !== "All") {
            whereClause.division = division;
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
                { user: { userName: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { user: { phoneNumber: { contains: search, mode: "insensitive" } } },
                { division: { contains: search, mode: "insensitive" } },
            ];
        }
        console.log("🔍 Where clause:", JSON.stringify(whereClause, null, 2));
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
        console.log(`✅ Found ${labs.length} labs`);
        const mappedLabs = labs.map(mapLabToFrontend);
        return res.status(200).json({
            success: true,
            message: "Labs retrieved successfully",
            data: mappedLabs,
            count: mappedLabs.length,
        });
    }
    catch (error) {
        console.error("❌ Error in getLabs:", error);
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
        console.log("🔍 getFilterOptions called");
        const divisions = await prisma_config_1.prisma.labs.findMany({
            distinct: ["division"],
            select: {
                division: true,
            },
            where: {
                division: {
                    not: null,
                },
            },
            orderBy: {
                division: "asc",
            },
        });
        const upazilas = await prisma_config_1.prisma.labs.findMany({
            distinct: ["upazila"],
            select: {
                upazila: true,
            },
            where: {
                upazila: {
                    not: null,
                },
            },
            orderBy: {
                upazila: "asc",
            },
        });
        const labTypes = await prisma_config_1.prisma.labs.findMany({
            distinct: ["lab_type"],
            select: {
                lab_type: true,
            },
            where: {
                lab_type: {
                    not: null,
                },
            },
            orderBy: {
                lab_type: "asc",
            },
        });
        console.log("✅ Filter options retrieved successfully");
        return res.status(200).json({
            success: true,
            message: "Filter options retrieved successfully",
            data: {
                divisions: divisions.map((d) => d.division).filter(Boolean),
                upazilas: upazilas.map((u) => u.upazila).filter(Boolean),
                labTypes: labTypes.map((l) => l.lab_type).filter(Boolean),
            },
        });
    }
    catch (error) {
        console.error("❌ Error in getFilterOptions:", error);
        const errorObj = {
            fnc: "getFilterOptions",
            error,
        };
        throw new AppError_util_1.AppError(errorObj);
    }
};
exports.getFilterOptions = getFilterOptions;
const newGetLabs = async (req, res) => {
    try {
        const labs = await prisma_config_1.prisma.labs.findMany({
            select: {
                id: true,
                division: true,
                seat: true,
                upazila: true,
                institute: true,
                lab_type: true,
                lat: true,
                long: true,
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
        const outputData = [];
        for (let lab of labs) {
            outputData.push(new labs_interface_1.ShapeData(lab));
        }
        return res.status(200).json({
            success: true,
            message: "Labs retrieved successfully",
            data: outputData,
            count: outputData.length,
        });
    }
    catch (error) {
        const errorObj = {
            fnc: "newGetLabs",
            error,
        };
        throw new AppError_util_1.AppError(errorObj);
    }
};
exports.newGetLabs = newGetLabs;
const updateLab = async (req, res) => {
    try {
        const { id } = req.params;
        const { head, email, mobile, alt_mobile, lat, long } = req.body;
        console.log("🔄 updateLab called with id:", id);
        console.log("📝 Update body:", req.body);
        const files = req.files;
        console.log("📸 Uploaded files:", files ? Object.keys(files) : "None");
        // Helper to consolidate images from body (existing) and files (new)
        const getImages = (fieldName) => {
            // Check if field acts as being "present" in the request
            const hasFiles = files && files[fieldName] && files[fieldName].length > 0;
            const hasBody = req.body[fieldName] !== undefined;
            if (!hasFiles && !hasBody)
                return undefined; // Signal "do not update"
            let rawImages = [];
            // 1. Get existing URLs from body
            const bodyValue = req.body[fieldName];
            if (bodyValue) {
                const processValue = (val) => {
                    if (typeof val === "string") {
                        const trimmed = val.trim();
                        if (trimmed === "")
                            return;
                        // Handle case where URLs might be concatenated with commas
                        // Split and flatten into the array
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
            // 2. Get new URLs from uploaded files
            if (hasFiles) {
                const uploadedUrls = files[fieldName].map((file) => file.path);
                rawImages = [...rawImages, ...uploadedUrls];
            }
            // Senior SE Note: Clean the array - remove duplicates and ensure strict single-index-per-URL
            const cleanedImages = [...new Set(rawImages)].filter(img => typeof img === "string" && img !== "");
            // Enforce max 2
            return cleanedImages.slice(0, 2);
        };
        const labImages = getImages('labImages');
        const institutionImages = getImages('institutionImages');
        // Find the lab first
        const lab = await prisma_config_1.prisma.labs.findUnique({
            where: {
                id: parseInt(id),
            },
            include: {
                user: true,
            },
        });
        if (!lab) {
            return res.status(404).json({
                success: false,
                message: "Lab not found",
            });
        }
        // Prepare update data for user
        const userUpdateData = {};
        if (head !== undefined)
            userUpdateData.userName = head;
        if (email !== undefined)
            userUpdateData.email = email;
        if (mobile !== undefined)
            userUpdateData.phoneNumber = mobile;
        if (alt_mobile !== undefined)
            userUpdateData.altPhoneNumber = alt_mobile;
        // Prepare update data for lab
        const labUpdateData = {};
        if (lat !== undefined)
            labUpdateData.lat = lat;
        if (long !== undefined)
            labUpdateData.long = long;
        if (labImages !== undefined) {
            labUpdateData.labImages = labImages;
        }
        if (institutionImages !== undefined) {
            labUpdateData.institutionImages = institutionImages;
        }
        // --- HANDLE DEFERRED CLOUDINARY DELETION ---
        const { deletedImages } = req.body;
        if (deletedImages) {
            try {
                let imagesToDelete = [];
                if (typeof deletedImages === 'string') {
                    imagesToDelete = JSON.parse(deletedImages);
                }
                else if (Array.isArray(deletedImages)) {
                    imagesToDelete = deletedImages;
                }
                // Senior SE Note: Security check - only delete images that actually belong to this lab
                const existingImages = new Set([
                    ...(lab.labImages || []),
                    ...(lab.institutionImages || [])
                ]);
                console.log("🗑️ Deferred deletion for images:", imagesToDelete);
                for (const imageUrl of imagesToDelete) {
                    // Ownership verification
                    if (!existingImages.has(imageUrl)) {
                        console.warn(`⚠️ Security Alert: Attempted to delete image not belonging to lab ${id}: ${imageUrl}`);
                        continue;
                    }
                    // Senior SE Note: Do not delete from Cloudinary if the image is still active in the new state
                    // (Handles cases where users might have duplicate URLs in the arrays)
                    if (labImages?.includes(imageUrl) || institutionImages?.includes(imageUrl)) {
                        console.log(`ℹ️ Skipping Cloudinary deletion for ${imageUrl} because it is still active in the new state`);
                        continue;
                    }
                    try {
                        const parts = imageUrl.split('/');
                        const uploadIndex = parts.indexOf('upload');
                        if (uploadIndex !== -1) {
                            let publicIdParts = parts.slice(uploadIndex + 1);
                            if (publicIdParts[0].match(/^v\d+$/)) {
                                publicIdParts.shift();
                            }
                            const publicIdWithExtension = publicIdParts.join('/');
                            const publicId = publicIdWithExtension.split('.')[0];
                            console.log(`☁️ Deleting deferred image from Cloudinary: ${publicId}`);
                            await cloudinary_config_1.default.uploader.destroy(publicId);
                        }
                    }
                    catch (err) {
                        console.error(`❌ Failed to delete image from Cloudinary: ${imageUrl}`, err);
                    }
                }
            }
            catch (parseError) {
                console.error("❌ Error parsing deletedImages:", parseError);
            }
        }
        // ------------------------------------------
        // Update user if there are user fields to update
        if (Object.keys(userUpdateData).length > 0) {
            await prisma_config_1.prisma.user.update({
                where: {
                    id: lab.userId,
                },
                data: userUpdateData,
            });
        }
        // Update lab if there are lab fields to update
        if (Object.keys(labUpdateData).length > 0) {
            await prisma_config_1.prisma.labs.update({
                where: {
                    id: parseInt(id),
                },
                data: labUpdateData,
            });
        }
        // Fetch updated lab
        const updatedLab = await prisma_config_1.prisma.labs.findUnique({
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
        const mappedLab = mapLabToFrontend(updatedLab);
        console.log("✅ Lab updated successfully");
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
