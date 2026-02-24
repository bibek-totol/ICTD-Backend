import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import { AppError } from "../utils/AppError.util";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";

export const createComplaint = async (req: Request, res: Response) => {
    try {
        const {
            division,
            district,
            upazila,
            institute,
            deviceType,
            deviceStatus,
            total,
            status
        } = req.body;

        const complaint = await prisma.complaint.create({
            data: {
                division,
                district,
                upazila,
                institute,
                deviceType,
                deviceStatus,
                total: parseInt(total) || 1,
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

export const getComplaints = async (req: Request, res: Response) => {
    try {
        const { division, upazila, deviceType, status, search } = req.query;

        const whereClause: any = {};

        if (division && division !== "All") {
            whereClause.division = division as string;
        }

        if (upazila && upazila !== "All") {
            whereClause.upazila = upazila as string;
        }

        if (deviceType && deviceType !== "All") {
            whereClause.deviceType = deviceType as string;
        }

        if (status && status !== "All") {
            whereClause.status = status as string;
        }

        if (search) {
            whereClause.OR = [
                { institute: { contains: search as string, mode: "insensitive" } },
                { district: { contains: search as string, mode: "insensitive" } },
                { upazila: { contains: search as string, mode: "insensitive" } },
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
            deviceType,
            deviceStatus,
            total,
            status
        } = req.body;

        const complaint = await prisma.complaint.update({
            where: { id },
            data: {
                division,
                district,
                upazila,
                institute,
                deviceType,
                deviceStatus,
                total: total ? parseInt(total) : undefined,
                status,
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
