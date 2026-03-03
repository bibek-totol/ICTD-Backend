import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.config";
import { Request } from "express";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: Request, file: Express.Multer.File) => {
        // Determine resource type based on file mimetype
        const isPdf = file.mimetype === 'application/pdf';

        return {
            folder: "announcements",
            allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
            resource_type: isPdf ? ("raw" as any) : ("image" as any),
            access_mode: "public", // Ensure public access for PDF viewer
            type: "upload",
            // Keep original filename for better URL structure
            use_filename: true,
            unique_filename: true,
            // For PDFs, ensure proper format
            ...(isPdf && {
                format: "pdf",
            }),
        };
    },
} as any);

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only image files or PDFs are allowed!"));
    }
};

export const announcementUpload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: fileFilter,
});
