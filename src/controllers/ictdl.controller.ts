import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import { AppError } from "../utils/AppError.util";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import cloudinary from "../configs/cloudinary.config";
import AppRequest from "../interfaces_and_types/AppRequest.interface";
import { normalizeJurisdiction } from "../utils/jurisdiction.util";

export const getICTDLLabs = async (req: Request, res: Response) => {
    try {
        const { division, district, upazila, search, page = "1", limit = "25" } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);
        const user = (req as AppRequest).user;

        const whereClause: any = {};

        // Professional Scoping & Language Normalization
        if (user?.role !== "SuperAdmin") {
            if (user?.role === "DistrictAdmin") {
                if (user.district) {
                    whereClause.district = { in: normalizeJurisdiction(user.district) };
                }
            } else if (user?.role === "DivisionAdmin") {
                if (user.division) {
                    whereClause.division = { in: normalizeJurisdiction(user.division) };
                }
            } else if (user?.role === "LabAdmin") {
                if (user.email) {
                    whereClause.email = { equals: user.email, mode: "insensitive" };
                } else {
                    whereClause.id = -1;
                }
            } else {
                if (user?.division) whereClause.division = { in: normalizeJurisdiction(user.division) };
                if (user?.district) whereClause.district = { in: normalizeJurisdiction(user.district) };
                if (user?.upazila) whereClause.upazila = user.upazila;
            }
        }

        // Secondary Filters (Query params)
        if (division && division !== "All") {
            const normalized = normalizeJurisdiction(division as string);
            whereClause.division = { in: normalized };
        }

        if (district && district !== "All") {
            const normalized = normalizeJurisdiction(district as string);
            whereClause.district = { in: normalized };
        }

        if (upazila && upazila !== "All") {
            whereClause.upazila = upazila as string;
        }

        if (search) {
            whereClause.OR = [
                { institute: { contains: search as string, mode: "insensitive" } },
                { head: { contains: search as string, mode: "insensitive" } },
                { email: { contains: search as string, mode: "insensitive" } },
                { mobile: { contains: search as string, mode: "insensitive" } },
                { division: { contains: search as string, mode: "insensitive" } },
                { district: { contains: search as string, mode: "insensitive" } },
            ];
        }

        const [labs, totalCount] = await Promise.all([
            prisma.ictdl_labs.findMany({
                where: whereClause,
                skip,
                take,
                orderBy: {
                    id: "asc",
                },
            }),
            prisma.ictdl_labs.count({
                where: whereClause,
            }),
        ]);

        return res.status(200).json({
            success: true,
            message: "ICTDL labs retrieved successfully",
            data: labs,
            totalCount,
            page: parseInt(page as string),
            limit: take,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "getICTDLLabs",
            error,
        };
        throw new AppError(errorObj);
    }
};

export const getICTDLLabsPublic = async (req: Request, res: Response) => {
    try {
        const { division, district, upazila, search, page = "1", limit = "25" } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const whereClause: any = {};

        if (division && division !== "All") {
            const normalized = normalizeJurisdiction(division as string);
            whereClause.division = { in: normalized };
        }
        if (district && district !== "All") {
            const normalized = normalizeJurisdiction(district as string);
            whereClause.district = { in: normalized };
        }
        if (upazila && upazila !== "All") {
            whereClause.upazila = upazila as string;
        }

        if (search) {
            whereClause.OR = [
                { institute: { contains: search as string, mode: "insensitive" } },
                { head: { contains: search as string, mode: "insensitive" } },
                { email: { contains: search as string, mode: "insensitive" } },
                { mobile: { contains: search as string, mode: "insensitive" } },
                { division: { contains: search as string, mode: "insensitive" } },
                { district: { contains: search as string, mode: "insensitive" } },
            ];
        }

        const [labs, totalCount] = await Promise.all([
            prisma.ictdl_labs.findMany({
                where: whereClause,
                skip,
                take,
                orderBy: { id: "asc" },
            }),
            prisma.ictdl_labs.count({ where: whereClause }),
        ]);

        return res.status(200).json({
            success: true,
            message: "Public ICTDL labs retrieved successfully",
            data: labs,
            totalCount,
            page: parseInt(page as string),
            limit: take,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = { fnc: "getICTDLLabsPublic", error };
        throw new AppError(errorObj);
    }
};

export const getICTDLabById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const lab = await prisma.ictdl_labs.findUnique({
            where: {
                id: parseInt(id as string),
            },
        });

        if (!lab) {
            return res.status(404).json({
                success: false,
                message: "ICTDL lab not found",
            });
        }

        // Jurisdiction & Role Check
        const userAuth = (req as AppRequest).user;
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.role === "LabAdmin") {
                if (lab.email?.toLowerCase() !== userAuth.email?.toLowerCase()) {
                    return res.status(403).json({ success: false, message: "Access denied: this is not your lab" });
                }
            } else {
                const normalizedDiv = userAuth?.division ? normalizeJurisdiction(userAuth.division) : [];
                const normalizedDist = userAuth?.district ? normalizeJurisdiction(userAuth.district) : [];

                if (userAuth?.division && !normalizedDiv.includes(lab.division || "")) {
                    return res.status(403).json({ success: false, message: "Access denied" });
                }
                if (userAuth?.district && !normalizedDist.includes(lab.district || "")) {
                    return res.status(403).json({ success: false, message: "Access denied" });
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "ICTDL lab retrieved successfully",
            data: lab,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "getICTDLabById",
            error,
        };
        throw new AppError(errorObj);
    }
};

export const getICTDLabByIdPublic = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const lab = await prisma.ictdl_labs.findUnique({
            where: { id: parseInt(id as string) },
        });

        if (!lab) {
            return res.status(404).json({ success: false, message: "ICTDL lab not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Public ICTDL lab retrieved successfully",
            data: lab,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = { fnc: "getICTDLabByIdPublic", error };
        throw new AppError(errorObj);
    }
};

export const updateICTDLab = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { division, district, upazila, head, email, mobile, lat, long, deletedImages } = req.body;
        const files = (req as any).files;

        const labId = parseInt(id as string);

        // Find the lab first
        const lab = await prisma.ictdl_labs.findUnique({
            where: { id: labId },
        });

        if (!lab) {
            return res.status(404).json({
                success: false,
                message: "ICTDL lab not found",
            });
        }

        // Jurisdiction & Role Check
        const userAuth = (req as AppRequest).user;
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.role === "LabAdmin") {
                if (lab.email?.toLowerCase() !== userAuth.email?.toLowerCase()) {
                    return res.status(403).json({ success: false, message: "Access denied: this is not your lab" });
                }
            } else if (userAuth?.role === "DistrictAdmin") {
                const normalizedDist = userAuth.district ? normalizeJurisdiction(userAuth.district) : [];
                if (!normalizedDist.includes(lab.district || "")) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your district" });
                }
            } else {
                const normalizedDiv = userAuth?.division ? normalizeJurisdiction(userAuth.division) : [];
                const normalizedDist = userAuth?.district ? normalizeJurisdiction(userAuth.district) : [];

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

        // Helper to consolidate images
        const getImages = (fieldName: string) => {
            const hasFiles = files && files[fieldName] && files[fieldName].length > 0;
            const hasBody = req.body[fieldName] !== undefined;

            if (!hasFiles && !hasBody) return undefined;

            let rawImages: string[] = [];

            const bodyValue = req.body[fieldName];
            if (bodyValue) {
                const processValue = (val: any) => {
                    if (typeof val === "string") {
                        const trimmed = val.trim();
                        if (trimmed === "") return;
                        const parts = trimmed.split(",").map(p => p.trim()).filter(p => p !== "");
                        rawImages = [...rawImages, ...parts];
                    }
                };

                if (Array.isArray(bodyValue)) {
                    bodyValue.forEach(processValue);
                } else {
                    processValue(bodyValue);
                }
            }

            if (hasFiles) {
                const uploadedUrls = files[fieldName].map((file: any) => file.path);
                rawImages = [...rawImages, ...uploadedUrls];
            }

            const cleanedImages = [...new Set(rawImages)].filter(img => typeof img === "string" && img !== "");
            return cleanedImages.slice(0, 2);
        };

        const labImages = getImages('labImages');
        const institutionImages = getImages('institutionImages');

        const updateData: any = {};

        // Only SuperAdmin can change jurisdiction
        if (userAuth?.role === "SuperAdmin") {
            if (division !== undefined) updateData.division = division;
            if (district !== undefined) updateData.district = district;
            if (upazila !== undefined) updateData.upazila = upazila;
        }
        if (head !== undefined) updateData.head = head;
        if (email !== undefined) updateData.email = email;
        if (mobile !== undefined) updateData.mobile = mobile;
        if (lat !== undefined) updateData.lat = parseFloat(lat);
        if (long !== undefined) updateData.long = parseFloat(long);
        if (labImages !== undefined) updateData.labImages = labImages;
        if (institutionImages !== undefined) updateData.institutionImages = institutionImages;

        // Handle Cloudinary deletions if any
        if (deletedImages) {
            try {
                let imagesToDelete: string[] = [];
                if (typeof deletedImages === 'string') {
                    imagesToDelete = JSON.parse(deletedImages);
                } else if (Array.isArray(deletedImages)) {
                    imagesToDelete = deletedImages;
                }

                const existingImages = new Set([
                    ...(lab.labImages || []),
                    ...(lab.institutionImages || [])
                ]);

                for (const imageUrl of imagesToDelete) {
                    if (!existingImages.has(imageUrl)) continue;

                    // Don't delete if still in use
                    if (labImages?.includes(imageUrl) || institutionImages?.includes(imageUrl)) continue;

                    try {
                        const parts = imageUrl.split('/');
                        const uploadIndex = parts.indexOf('upload');
                        if (uploadIndex !== -1) {
                            let publicIdParts = parts.slice(uploadIndex + 1);
                            if (publicIdParts[0].match(/^v\d+$/)) publicIdParts.shift();
                            const publicId = publicIdParts.join('/').split('.')[0];
                            await cloudinary.uploader.destroy(publicId);
                        }
                    } catch (err) {
                        console.error(`❌ Cloudinary deletion failed for ${imageUrl}:`, err);
                    }
                }
            } catch (e) {
                console.error("❌ Error processing deletedImages:", e);
            }
        }

        const updatedLab = await prisma.ictdl_labs.update({
            where: { id: labId },
            data: updateData,
        });

        return res.status(200).json({
            success: true,
            message: "ICTDL lab updated successfully",
            data: updatedLab,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "updateICTDLab",
            error,
        };
        throw new AppError(errorObj);
    }
};

export const getICTDLFilterOptions = async (req: Request, res: Response) => {
    try {
        const { division, district } = req.query;
        const user = (req as AppRequest).user;
        const where: any = {};

        if (user?.role !== "SuperAdmin") {
            if (user?.role === "DistrictAdmin" && user.district) {
                where.district = { in: normalizeJurisdiction(user.district) };
            } else if (user?.role === "DivisionAdmin" && user.division) {
                where.division = { in: normalizeJurisdiction(user.division) };
            } else if (user?.role === "LabAdmin") {
                if (user.email) {
                    where.email = { equals: user.email, mode: "insensitive" };
                } else {
                    where.id = -1;
                }
            } else {
                if (user?.division) where.division = { in: normalizeJurisdiction(user.division) };
                if (user?.district) where.district = { in: normalizeJurisdiction(user.district) };
                if (user?.upazila) where.upazila = user.upazila;
            }
        }

        // Dynamic filtering via query params
        if (division && division !== "All") {
            where.division = { in: normalizeJurisdiction(division as string) };
        }
        if (district && district !== "All") {
            where.district = { in: normalizeJurisdiction(district as string) };
        }

        const divisions = await prisma.ictdl_labs.findMany({
            distinct: ["division"],
            select: { division: true },
            where: { AND: [where, { division: { not: null, notIn: ["", " "] } }] },
            orderBy: { division: "asc" },
        });

        const districts = await prisma.ictdl_labs.findMany({
            distinct: ["district"],
            select: { district: true },
            where: { AND: [where, { district: { not: "", notIn: [" ", "null", "NULL"] } }] },
            orderBy: { district: "asc" },
        });

        const upazilas = await prisma.ictdl_labs.findMany({
            distinct: ["upazila"],
            select: { upazila: true },
            where: { AND: [where, { upazila: { not: "", notIn: [" ", "null", "NULL"] } }] },
            orderBy: { upazila: "asc" },
        });

        return res.status(200).json({
            success: true,
            message: "ICTDL filter options retrieved successfully",
            data: {
                divisions: divisions.map((d: any) => d.division).filter(Boolean),
                districts: districts.map((d: any) => d.district).filter(Boolean),
                upazilas: upazilas.map((u: any) => u.upazila).filter(Boolean),
            },
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "getICTDLFilterOptions",
            error,
        };
        throw new AppError(errorObj);
    }
};

export const getICTDLFilterOptionsPublic = async (req: Request, res: Response) => {
    try {
        const divisions = await prisma.ictdl_labs.findMany({
            distinct: ["division"],
            select: { division: true },
            where: { division: { not: null, notIn: ["", " "] } },
            orderBy: { division: "asc" },
        });

        const districts = await prisma.ictdl_labs.findMany({
            distinct: ["district"],
            select: { district: true },
            where: { district: { not: "", notIn: [" ", "null", "NULL"] } },
            orderBy: { district: "asc" },
        });

        const upazilas = await prisma.ictdl_labs.findMany({
            distinct: ["upazila"],
            select: { upazila: true },
            where: { upazila: { not: "", notIn: [" ", "null", "NULL"] } },
            orderBy: { upazila: "asc" },
        });

        return res.status(200).json({
            success: true,
            message: "Public ICTDL filter options retrieved successfully",
            data: {
                divisions: divisions.map((d: any) => d.division).filter(Boolean),
                districts: districts.map((d: any) => d.district).filter(Boolean),
                upazilas: upazilas.map((u: any) => u.upazila).filter(Boolean),
            },
        });
    } catch (error) {
        const errorObj: AppErrorPayload = { fnc: "getICTDLFilterOptionsPublic", error };
        throw new AppError(errorObj);
    }
};

export const bulkICTDLInsert = async (req: Request, res: Response) => {
    try {
        const { labs } = req.body as any;

        if (!Array.isArray(labs)) {
            return res.status(400).json({
                success: false,
                message: "labs field must be an array",
            });
        }

        const labsToInsert = labs.map((lab: any) => ({
            division: lab.division || null,
            district: lab.district || "Unknown",
            upazila: lab.upazila || "Unknown",
            institute: lab.institute || "Unknown",
            head: lab.head || "Unknown",
            mobile: lab.mobile ? String(lab.mobile) : "Unknown",
            email: lab.email || null,
            lat: parseFloat(lab.lat) || 0,
            long: parseFloat(lab.long) || 0,
            labImages: [],
            institutionImages: [],
        }));

        const result = await prisma.ictdl_labs.createMany({
            data: labsToInsert as any,
            skipDuplicates: true,
        });

        return res.status(201).json({
            success: true,
            message: `${result.count} ICTDL labs inserted successfully`,
            data: result,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "bulkICTDLInsert",
            error,
        };
        throw new AppError(errorObj);
    }
};
