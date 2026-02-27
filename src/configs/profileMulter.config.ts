import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.config";

// Configure Cloudinary storage for profile pictures
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "user-profiles", // Folder in Cloudinary
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }], // Profile pic optimization
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
        cb(new Error("Only image files (JPEG, JPG, PNG) are allowed!"));
    }
};

// Configure multer with Cloudinary storage
export const profileUpload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB per file is enough for profile pic
    },
    fileFilter: fileFilter,
});
