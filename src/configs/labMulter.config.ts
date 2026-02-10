import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.config";

// Configure Cloudinary storage for Lab Images
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "labs/images",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 1200, height: 1200, crop: "limit" }],
    } as any,
});

// File filter to accept only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only image files (JPEG, JPG, PNG, WEBP) are allowed!"));
    }
};

export const labUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: fileFilter,
});
