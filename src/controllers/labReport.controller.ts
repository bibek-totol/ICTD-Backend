import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import { AppError } from "../utils/AppError.util";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";

export const createLabReport = async (req: Request, res: Response) => {
    try {
        const {
            labId,
            basicRobotics,
            advancedRobotics,
            "3dPrinter": threeDPrinter,
            vrHeadset,
            networkCamera,
            ups,
            isFunctional,
            damageDetails,
            recommendations,
        } = req.body;

        // Get uploaded files from multer
        const files = req.files as Express.Multer.File[];
        const storageImages: string[] = files ? files.map(file => `/uploads/storage-images/${file.filename}`) : [];

        const report = await prisma.labReport.create({
            data: {
                labId: parseInt(labId),
                basicRobotics: parseInt(basicRobotics) || 0,
                advancedRobotics: parseInt(advancedRobotics) || 0,
                threeDPrinter: parseInt(threeDPrinter) || 0,
                vrHeadset: parseInt(vrHeadset) || 0,
                networkCamera: parseInt(networkCamera) || 0,
                ups: parseInt(ups) || 0,
                isFunctional: isFunctional || null,
                damageDetails: damageDetails || null,
                storageConditions: null, // No longer used
                storageImages: storageImages,
                recommendations: recommendations || null,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            data: report,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "createLabReport",
            error,
        };
        throw new AppError(errorObj);
    }
};

export const getLabReports = async (req: Request, res: Response) => {
    try {
        const { division, upazila, labType, search } = req.query;

        const whereClause: any = {};

        if (division && division !== "All") {
            whereClause.lab = {
                division: division as string,
            };
        }

        if (upazila && upazila !== "All") {
            whereClause.lab = {
                ...whereClause.lab,
                upazila: upazila as string,
            };
        }

        if (labType && labType !== "All") {
            whereClause.lab = {
                ...whereClause.lab,
                lab_type: labType as string,
            };
        }

        if (search) {
            whereClause.OR = [
                { lab: { institute: { contains: search as string, mode: "insensitive" } } },
                { lab: { division: { contains: search as string, mode: "insensitive" } } },
                { lab: { upazila: { contains: search as string, mode: "insensitive" } } },
            ];
        }

        const reports = await prisma.labReport.findMany({
            where: whereClause,
            include: {
                lab: {
                    include: {
                        user: {
                            select: {
                                userName: true, // head
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const mappedReports = reports.map((report) => ({
            id: report.id,
            labId: report.labId,
            institute: report.lab.institute,
            division: report.lab.division,
            upazila: report.lab.upazila,
            labType: report.lab.lab_type,
            head: report.lab.user?.userName,
            basicRobotics: report.basicRobotics,
            advancedRobotics: report.advancedRobotics,
            "3dPrinter": report.threeDPrinter,
            vrHeadset: report.vrHeadset,
            networkCamera: report.networkCamera,
            ups: report.ups,
            isFunctional: report.isFunctional,
            damageDetails: report.damageDetails,
            storageConditions: report.storageConditions,
            storageImages: report.storageImages,
            recommendations: report.recommendations,
            createdAt: report.createdAt,
        }));

        return res.status(200).json({
            success: true,
            message: "Reports retrieved successfully",
            data: mappedReports,
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "getLabReports",
            error,
        };
        throw new AppError(errorObj);
    }
};

export const deleteLabReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.labReport.delete({
            where: {
                id: id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Report deleted successfully",
        });
    } catch (error) {
        const errorObj: AppErrorPayload = {
            fnc: "deleteLabReport",
            error,
        };
        throw new AppError(errorObj);
    }
};
