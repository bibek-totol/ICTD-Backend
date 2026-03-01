import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import { AppError } from "../utils/AppError.util";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import cloudinary from "../configs/cloudinary.config";

export const createComplaint = async (req: Request, res: Response) => {
    try {
        const {
            division,
            district,
            upazila,
            institute,
            category,
            subject,
            description,
            priority,
            complainantName,
            complainantPhone,
            status
        } = req.body;

        const files = req.files as Express.Multer.File[];
        const complaintImages = files ? files.map(file => (file as any).path) : [];

        const complaint = await prisma.complaint.create({
            data: {
                division,
                district,
                upazila,
                institute,
                category,
                subject,
                description,
                priority: priority || "Medium",
                complainantName,
                complainantPhone: complainantPhone || null,
                complaintImages: complaintImages || [],
                status: status || "Pending",
            },
        });

        return res.status(201).json({
            success: true,
            message: "Complaint created successfully",
            data: complaint,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "createComplaint",
            error,
        };
        throw new AppError(errorObj);
    }
};

import AppRequest from "../interfaces_and_types/AppRequest.interface";
import { normalizeJurisdiction } from "../utils/jurisdiction.util";

export const getComplaints = async (req: Request, res: Response) => {
    try {
        const { division, district, upazila, category, status, search } = req.query;
        const userAuth = (req as AppRequest).user;

        const whereClause: any = {};

        // Enforce Jurisdiction & Role Scoping
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.role === "DistrictAdmin") {
                if (userAuth.district) whereClause.district = { in: normalizeJurisdiction(userAuth.district) };
            } else if (userAuth?.role === "DivisionAdmin") {
                if (userAuth.division) whereClause.division = { in: normalizeJurisdiction(userAuth.division) };
            } else if (userAuth?.role === "LabAdmin") {
                // Find all institutes for this LabAdmin (email match)
                const [sofLabs, ictdlLabs] = await Promise.all([
                    prisma.labs.findMany({
                        where: { email: { equals: userAuth.email, mode: "insensitive" } } as any,
                        select: { institute: true }
                    }),
                    prisma.ictdl_labs.findMany({
                        where: { email: { equals: userAuth.email, mode: "insensitive" } },
                        select: { institute: true }
                    })
                ]);

                const institutes = [
                    ...sofLabs.map(l => l.institute),
                    ...ictdlLabs.map(l => l.institute)
                ].filter(Boolean) as string[];

                if (institutes.length > 0) {
                    whereClause.institute = { in: institutes };
                } else {
                    whereClause.id = "none";
                }
            } else {
                if (userAuth?.division) whereClause.division = { in: normalizeJurisdiction(userAuth.division) };
                if (userAuth?.district) whereClause.district = { in: normalizeJurisdiction(userAuth.district) };
                if (userAuth?.upazila) whereClause.upazila = userAuth.upazila;
            }
        }

        if (division && division !== "All") {
            whereClause.division = whereClause.division || (division as string);
        }

        if (district && district !== "All") {
            whereClause.district = whereClause.district || (district as string);
        }

        if (upazila && upazila !== "All") {
            whereClause.upazila = upazila as string;
        }

        if (category && category !== "All") {
            whereClause.category = category as string;
        }

        if (status && status !== "All") {
            whereClause.status = status as string;
        }

        if (search) {
            whereClause.OR = [
                { institute: { contains: search as string, mode: "insensitive" } },
                { district: { contains: search as string, mode: "insensitive" } },
                { upazila: { contains: search as string, mode: "insensitive" } },
                { subject: { contains: search as string, mode: "insensitive" } },
                { description: { contains: search as string, mode: "insensitive" } },
            ];
        }

        const complaints = await prisma.complaint.findMany({
            where: whereClause,
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            message: "Complaints retrieved successfully",
            data: complaints,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "getComplaints",
            error,
        };
        throw new AppError(errorObj);
    }
};

export const updateComplaint = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            division,
            district,
            upazila,
            institute,
            category,
            subject,
            description,
            priority,
            complainantName,
            complainantPhone,
            status,
            resolutionNotes,
            resolvedAt,
            deletedImages // URLs of images to delete
        } = req.body;

        const files = req.files as Express.Multer.File[];
        const newImages = files ? files.map(file => (file as any).path) : [];

        // Find existing complaint
        const existingComplaint = await prisma.complaint.findUnique({
            where: { id },
        });

        if (!existingComplaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found",
            });
        }

        // Jurisdiction & Role Check
        const userAuth = (req as AppRequest).user;
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.role === "LabAdmin") {
                // Find all institutes for this LabAdmin (email match)
                const [sofLabs, ictdlLabs] = await Promise.all([
                    prisma.labs.findMany({
                        where: { email: userAuth.email } as any,
                        select: { institute: true }
                    }),
                    prisma.ictdl_labs.findMany({
                        where: { email: userAuth.email } as any,
                        select: { institute: true }
                    })
                ]);

                const institutes = [
                    ...sofLabs.map(l => l.institute),
                    ...ictdlLabs.map(l => l.institute)
                ].filter(Boolean) as string[];

                if (!institutes.includes(existingComplaint.institute)) {
                    return res.status(403).json({ success: false, message: "Unauthorized: this complaint does not belong to your lab" });
                }
            } else {
                const normalizedDiv = userAuth?.division ? normalizeJurisdiction(userAuth.division) : [];
                const normalizedDist = userAuth?.district ? normalizeJurisdiction(userAuth.district) : [];

                if (userAuth?.division && !normalizedDiv.includes(existingComplaint.division)) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your division" });
                }
                if (userAuth?.district && !normalizedDist.includes(existingComplaint.district)) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your district" });
                }
            }
        }

        // Handle image updates
        let updatedImages = existingComplaint.complaintImages ? [...existingComplaint.complaintImages] : [];

        // Remove deleted images
        if (deletedImages) {
            let imagesToDelete = [];
            try {
                imagesToDelete = typeof deletedImages === "string" ? JSON.parse(deletedImages) : deletedImages;
                if (!Array.isArray(imagesToDelete)) imagesToDelete = [imagesToDelete];
            } catch (err) {
                imagesToDelete = Array.isArray(deletedImages) ? deletedImages : [deletedImages];
            }

            for (const imageUrl of imagesToDelete) {
                updatedImages = updatedImages.filter(img => img !== imageUrl);

                // Delete from Cloudinary
                try {
                    const parts = imageUrl.split('/');
                    const filename = parts[parts.length - 1].split('.')[0];
                    const folder = parts[parts.length - 2];
                    // The public_id should be "complaints/images/filename"
                    await cloudinary.uploader.destroy(`complaints/${folder}/${filename}`);
                } catch (err) {
                    console.error("Cloudinary deletion error:", err);
                }
            }
        }

        // Add new images
        updatedImages = [...updatedImages, ...newImages];

        const complaint = await prisma.complaint.update({
            where: { id },
            data: {
                division,
                district,
                upazila,
                institute,
                category,
                subject,
                description,
                priority,
                complainantName,
                complainantPhone: complainantPhone || null,
                complaintImages: updatedImages,
                status: status || "Pending",
                resolutionNotes: resolutionNotes || null,
                resolvedAt: resolvedAt ? new Date(resolvedAt) : null,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Complaint updated successfully",
            data: complaint,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "updateComplaint",
            error,
        };
        throw new AppError(errorObj);
    }
};

export const deleteComplaint = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Find complaint to delete images from Cloudinary
        const complaint = await prisma.complaint.findUnique({
            where: { id },
        });

        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        // Authorization Check
        const userAuth = (req as AppRequest).user;
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.role === "LabAdmin") {
                const [sofLabs, ictdlLabs] = await Promise.all([
                    prisma.labs.findMany({
                        where: { email: userAuth.email } as any,
                        select: { institute: true }
                    }),
                    prisma.ictdl_labs.findMany({
                        where: { email: userAuth.email } as any,
                        select: { institute: true }
                    })
                ]);

                const institutes = [
                    ...sofLabs.map(l => l.institute),
                    ...ictdlLabs.map(l => l.institute)
                ].filter(Boolean) as string[];

                if (!institutes.includes(complaint.institute)) {
                    return res.status(403).json({ success: false, message: "Unauthorized" });
                }
            } else {
                const normalizedDiv = userAuth?.division ? normalizeJurisdiction(userAuth.division) : [];
                const normalizedDist = userAuth?.district ? normalizeJurisdiction(userAuth.district) : [];

                if (userAuth?.division && !normalizedDiv.includes(complaint.division)) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your division" });
                }
                if (userAuth?.district && !normalizedDist.includes(complaint.district)) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your district" });
                }
            }
        }

        if (complaint.complaintImages && complaint.complaintImages.length > 0) {
            for (const imageUrl of complaint.complaintImages) {
                try {
                    const parts = imageUrl.split('/');
                    const filename = parts[parts.length - 1].split('.')[0];
                    const folder = parts[parts.length - 2];
                    await cloudinary.uploader.destroy(`complaints/${folder}/${filename}`);
                } catch (err) {
                    console.error("Cloudinary deletion error:", err);
                }
            }
        }

        await prisma.complaint.delete({
            where: { id },
        });

        return res.status(200).json({
            success: true,
            message: "Complaint deleted successfully",
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "deleteComplaint",
            error,
        };
        throw new AppError(errorObj);
    }
};
