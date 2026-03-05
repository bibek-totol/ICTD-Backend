import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import { AppError } from "../utils/AppError.util";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import cloudinary from "../configs/cloudinary.config";

export const createNotice = async (req: Request, res: Response) => {
    try {
        const { title, serial, isActive } = req.body;
        const file = req.file;

        let fileUrl = null;
        if (file) {
            fileUrl = (file as any).path;
            if (file.mimetype === 'application/pdf' && fileUrl) {
                if (!fileUrl.endsWith('.pdf')) {
                    fileUrl = fileUrl + '.pdf';
                }
            }
        }

        if (typeof (prisma as any).notice?.create !== 'function') {
            throw new Error('Prisma client missing Notice model. Run "npx prisma generate" and restart the server.');
        }

        const notice = await prisma.notice.create({
            data: {
                title,
                serial: serial ? parseInt(serial as string) : 0,
                isActive: isActive === 'false' ? false : true,
                fileUrl
            }
        });

        res.status(201).json({
            success: true,
            message: "Notice created successfully",
            data: notice
        });
    } catch (error) {
        const errorObj: AppErrorPayload = { fnc: "createNotice", error };
        throw new AppError(errorObj);
    }
};

export const getNotices = async (req: Request, res: Response) => {
    try {
        const notices = await prisma.notice.findMany({
            orderBy: { serial: 'asc' }
        });

        res.status(200).json({
            success: true,
            data: notices
        });
    } catch (error) {
        const errorObj: AppErrorPayload = { fnc: "getNotices", error };
        throw new AppError(errorObj);
    }
};

export const getActiveNotices = async (req: Request, res: Response) => {
    try {
        const notices = await prisma.notice.findMany({
            where: { isActive: true },
            orderBy: [{ serial: 'asc' }, { createdAt: 'desc' }]
        });

        res.status(200).json({
            success: true,
            data: notices
        });
    } catch (error) {
        const errorObj: AppErrorPayload = { fnc: "getActiveNotices", error };
        throw new AppError(errorObj);
    }
};

export const updateNotice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, serial, isActive, deleteFile } = req.body;
        const file = req.file;

        const existing = await prisma.notice.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: "Notice not found" });
        }

        let fileUrl = existing.fileUrl;

        if (file) {
            if (existing.fileUrl) {
                try {
                    const urlParts = existing.fileUrl.split('/');
                    const fileNameWithExt = urlParts[urlParts.length - 1];
                    const fileName = fileNameWithExt.split('.')[0];
                    const folder = urlParts[urlParts.length - 2];
                    const publicId = `${folder}/${fileName}`;
                    const resourceType = existing.fileUrl.toLowerCase().includes('.pdf') ? 'raw' : 'image';
                    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
                } catch (err) {
                    console.error("Cloudinary delete error:", err);
                }
            }
            fileUrl = (file as any).path;
            if (file.mimetype === 'application/pdf' && fileUrl) {
                if (!fileUrl.endsWith('.pdf')) {
                    fileUrl = fileUrl + '.pdf';
                }
            }
        } else if (deleteFile === 'true' && existing.fileUrl) {
            try {
                const urlParts = existing.fileUrl.split('/');
                const fileNameWithExt = urlParts[urlParts.length - 1];
                const fileName = fileNameWithExt.split('.')[0];
                const folder = urlParts[urlParts.length - 2];
                const publicId = `${folder}/${fileName}`;
                const resourceType = existing.fileUrl.toLowerCase().includes('.pdf') ? 'raw' : 'image';
                await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            } catch (err) {
                console.error("Cloudinary delete error:", err);
            }
            fileUrl = null;
        }

        const updated = await prisma.notice.update({
            where: { id: parseInt(id) },
            data: {
                title,
                serial: serial ? parseInt(serial as string) : undefined,
                isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined,
                fileUrl
            }
        });

        res.status(200).json({
            success: true,
            message: "Notice updated successfully",
            data: updated
        });
    } catch (error) {
        const errorObj: AppErrorPayload = { fnc: "updateNotice", error };
        throw new AppError(errorObj);
    }
};

export const deleteNotice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existing = await prisma.notice.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: "Notice not found" });
        }

        if (existing.fileUrl) {
            try {
                const urlParts = existing.fileUrl.split('/');
                const fileNameWithExt = urlParts[urlParts.length - 1];
                const fileName = fileNameWithExt.split('.')[0];
                const folder = urlParts[urlParts.length - 2];
                const publicId = `${folder}/${fileName}`;
                const resourceType = existing.fileUrl.toLowerCase().includes('.pdf') ? 'raw' : 'image';
                await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            } catch (err) {
                console.error("Cloudinary delete error:", err);
            }
        }

        await prisma.notice.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({
            success: true,
            message: "Notice deleted successfully"
        });
    } catch (error) {
        const errorObj: AppErrorPayload = { fnc: "deleteNotice", error };
        throw new AppError(errorObj);
    }
};
