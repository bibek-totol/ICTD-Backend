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


        const files = req.files as Express.Multer.File[];
        const storageImages: string[] = files ? files.map((file: any) => file.path) : [];

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
                storageConditions: null,
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

import AppRequest from "../interfaces_and_types/AppRequest.interface";
import { normalizeJurisdiction } from "../utils/jurisdiction.util";

export const getLabReports = async (req: Request, res: Response) => {
    try {
        const { division, district, upazila, labType, search } = req.query;
        const userAuth = (req as AppRequest).user;

        const whereClause: any = {};
        const labClause: any = {};

        // Enforce Jurisdiction & Role Scoping
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.role === "DistrictAdmin") {
                if (userAuth.district) labClause.district = { in: normalizeJurisdiction(userAuth.district) };
            } else if (userAuth?.role === "DivisionAdmin") {
                if (userAuth.division) labClause.division = { in: normalizeJurisdiction(userAuth.division) };
            } else if (userAuth?.role === "LabAdmin") {
                if (userAuth.email) {
                    labClause.email = userAuth.email;
                } else {
                    labClause.id = -1;
                }
            } else {
                if (userAuth?.division) labClause.division = { in: normalizeJurisdiction(userAuth.division) };
                if (userAuth?.district) labClause.district = { in: normalizeJurisdiction(userAuth.district) };
                if (userAuth?.upazila) labClause.upazila = userAuth.upazila;
            }
        }

        // Filters from query (only applied if not overridden by jurisdiction)
        if (division && division !== "All") {
            labClause.division = labClause.division || (division as string);
        }

        if (district && district !== "All") {
            labClause.district = labClause.district || (district as string);
        }

        if (upazila && upazila !== "All") {
            labClause.upazila = labClause.upazila || (upazila as string);
        }

        if (labType && labType !== "All") {
            labClause.lab_type = labClause.lab_type || (labType as string);
        }

        if (search) {
            whereClause.OR = [
                { lab: { institute: { contains: search as string, mode: "insensitive" } } },
                { lab: { division: { contains: search as string, mode: "insensitive" } } },
                { lab: { district: { contains: search as string, mode: "insensitive" } } },
                { lab: { upazila: { contains: search as string, mode: "insensitive" } } },
            ];
        }

        if (Object.keys(labClause).length > 0) {
            whereClause.lab = { ...whereClause.lab, ...labClause };
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
        const userAuth = (req as AppRequest).user;

        const report = await prisma.labReport.findUnique({
            where: { id },
            include: { lab: true }
        });

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        // Authorization Check
        if (userAuth?.role !== "SuperAdmin") {
            if (userAuth?.role === "LabAdmin") {
                if ((report.lab as any).email !== userAuth.email) {
                    return res.status(403).json({ success: false, message: "Unauthorized: this report does not belong to your lab" });
                }
            } else {
                const normalizedDiv = userAuth?.division ? normalizeJurisdiction(userAuth.division) : [];
                const normalizedDist = userAuth?.district ? normalizeJurisdiction(userAuth.district) : [];

                if (userAuth?.division && !normalizedDiv.includes(report.lab.division || "")) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your division" });
                }
                if (userAuth?.district && !normalizedDist.includes(report.lab.district || "")) {
                    return res.status(403).json({ success: false, message: "Unauthorized: outside your district" });
                }
            }
        }

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
