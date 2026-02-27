import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import { AppError } from "../utils/AppError.util";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import cloudinary from "../configs/cloudinary.config";
import AppRequest from "../interfaces_and_types/AppRequest.interface";

export const getICTDLLabs = async (req: Request, res: Response) => {
    try {
        const { division, district, upazila, search, page = "1", limit = "25" } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);
        const user = (req as AppRequest).user;

        const whereClause: any = {};

        // Jurisdiction Enforce
        if (user?.role !== "SuperAdmin") {
            if (user?.division) whereClause.division = user.division;
            if (user?.district) whereClause.district = user.district;
            if (user?.upazila) whereClause.upazila = user.upazila;
        }

        // Override with query params ONLY if user is SuperAdmin or within their range
        if (division && division !== "All") {
            if (user?.role === "SuperAdmin" || user?.division === division) {
                whereClause.division = division as string;
            }
        }

        if (district && district !== "All") {
            if (user?.role === "SuperAdmin" || user?.role === "DivisionAdmin" || user?.district === district) {
                whereClause.district = district as string;
            }
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

        // Jurisdiction Check
        const userAuth = (req as AppRequest).user;
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.division && lab.division !== userAuth.division) {
                return res.status(403).json({ success: false, message: "Access denied" });
            }
            if (userAuth?.district && lab.district !== userAuth.district) {
                return res.status(403).json({ success: false, message: "Access denied" });
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

        // Jurisdiction Check
        const userAuth = (req as AppRequest).user;
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.division && lab.division !== userAuth.division) {
                return res.status(403).json({ success: false, message: "Unauthorized" });
            }
            if (userAuth?.district && lab.district !== userAuth.district) {
                return res.status(403).json({ success: false, message: "Unauthorized" });
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
        if (division !== undefined) updateData.division = division;
        if (district !== undefined) updateData.district = district;
        if (upazila !== undefined) updateData.upazila = upazila;
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
        const user = (req as AppRequest).user;
        const where: any = {};

        if (user?.role !== "SuperAdmin") {
            if (user?.division) where.division = user.division;
            if (user?.district) where.district = user.district;
            if (user?.upazila) where.upazila = user.upazila;
        }

        const divisions = await prisma.ictdl_labs.findMany({
            distinct: ["division"],
            select: { division: true },
            where: { ...where, division: { not: null } },
            orderBy: { division: "asc" },
        });

        const districts = await prisma.ictdl_labs.findMany({
            distinct: ["district"],
            select: { district: true },
            where: { ...where, district: { not: null } },
            orderBy: { district: "asc" },
        });

        const upazilas = await prisma.ictdl_labs.findMany({
            distinct: ["upazila"],
            select: { upazila: true },
            where: { ...where, upazila: { not: null } },
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
            district: lab.district,
            upazila: lab.upazila,
            institute: lab.institute,
            head: lab.head,
            mobile: String(lab.mobile),
            email: lab.email || null,
            lat: parseFloat(lab.lat) || 0,
            long: parseFloat(lab.long) || 0,
            labImages: [],
            institutionImages: [],
        }));

        const result = await prisma.ictdl_labs.createMany({
            data: labsToInsert,
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
