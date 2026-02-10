import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import { AppError } from "../utils/AppError.util";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import { LabTypes } from "@prisma/client";
import {
  OutputStructure,
  NestedUser,
  ShapeData,
} from "../interfaces_and_types/labs.interface";
import cloudinary from "../configs/cloudinary.config";

const mapLabToFrontend = (lab: any) => ({
  id: lab.id,
  institute: lab.institute,
  division: lab.division,
  upazila: lab.upazila,
  seat: lab.seat,
  head: lab.user?.userName ?? lab.head,
  mobile: lab.user?.phoneNumber ?? lab.mobile,
  altMobile: lab.user?.altPhoneNumber ?? lab.alt_mobile,
  email: lab.user?.email ?? lab.email,
  labType: lab.lab_type,
  lat: lab.lat,
  long: lab.long,
  labImages: lab.labImages ?? [],
  institutionImages: lab.institutionImages ?? [],
});

export const getLabs = async (req: Request, res: Response) => {
  try {
    const { division, upazila, labType, search } = req.query;

    const whereClause: any = {};

    if (division && division !== "All") {
      whereClause.division = division as string;
    }

    if (upazila && upazila !== "All") {
      whereClause.upazila = upazila as string;
    }

    if (labType && labType !== "All") {
      whereClause.lab_type = labType as string;
    }

    if (search) {
      whereClause.OR = [
        { institute: { contains: search as string, mode: "insensitive" } },
        { user: { userName: { contains: search as string, mode: "insensitive" } } },
        { user: { email: { contains: search as string, mode: "insensitive" } } },
        { user: { phoneNumber: { contains: search as string, mode: "insensitive" } } },
        { division: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const labs = await prisma.labs.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            userName: true,
            email: true,
            phoneNumber: true,
            altPhoneNumber: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const mappedLabs = labs.map(mapLabToFrontend);

    return res.status(200).json({
      success: true,
      message: "Labs retrieved successfully",
      data: mappedLabs,
      count: mappedLabs.length,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = {
      fnc: "getLabs",
      error,
    };
    throw new AppError(errorObj);
  }
};

export const getLabById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const lab = await prisma.labs.findUnique({
      where: {
        id: parseInt(id as string),
      },
      include: {
        user: {
          select: {
            userName: true,
            email: true,
            phoneNumber: true,
            altPhoneNumber: true,
          },
        },
      },
    });

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    const mappedLab = mapLabToFrontend(lab);

    return res.status(200).json({
      success: true,
      message: "Lab retrieved successfully",
      data: mappedLab,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = {
      fnc: "getLabById",
      error,
    };
    throw new AppError(errorObj);
  }
};

export const getFilterOptions = async (req: Request, res: Response) => {
  try {
    const divisions = await prisma.labs.findMany({
      distinct: ["division"],
      select: { division: true },
      where: { division: { not: null } },
      orderBy: { division: "asc" },
    });

    const upazilas = await prisma.labs.findMany({
      distinct: ["upazila"],
      select: { upazila: true },
      where: { upazila: { not: null } },
      orderBy: { upazila: "asc" },
    });

    const labTypes = await prisma.labs.findMany({
      distinct: ["lab_type"],
      select: { lab_type: true },
      where: { lab_type: { not: null } },
      orderBy: { lab_type: "asc" },
    });

    return res.status(200).json({
      success: true,
      message: "Filter options retrieved successfully",
      data: {
        divisions: divisions.map((d) => d.division).filter(Boolean),
        upazilas: upazilas.map((u) => u.upazila).filter(Boolean),
        labTypes: labTypes.map((l) => l.lab_type).filter(Boolean),
      },
    });
  } catch (error) {
    const errorObj: AppErrorPayload = {
      fnc: "getFilterOptions",
      error,
    };
    throw new AppError(errorObj);
  }
};

export const updateLab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { head, email, mobile, alt_mobile, lat, long, deletedImages } = req.body;
    const files = (req as any).files;

    const labId = parseInt(id as string);

    // Find the lab first
    const lab = await prisma.labs.findUnique({
      where: { id: labId },
      include: { user: true },
    });

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    // Helper to consolidate images (exact logic from ictdl.controller.ts)
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

    // Handle Cloudinary deletions (exact logic from ictdl.controller.ts)
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

    // Update with Transaction
    const updatedLab = await prisma.$transaction(async (tx) => {
      // 1. Update Related User record
      const userUpdateData: any = {};
      if (head !== undefined) userUpdateData.userName = head;
      if (email !== undefined) userUpdateData.email = email;
      if (mobile !== undefined) userUpdateData.phoneNumber = mobile;
      if (alt_mobile !== undefined) userUpdateData.altPhoneNumber = alt_mobile;

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: lab.userId },
          data: userUpdateData,
        });
      }

      // 2. Update Lab record
      const labUpdateData: any = {};
      if (lat !== undefined) labUpdateData.lat = lat.toString();
      if (long !== undefined) labUpdateData.long = long.toString();
      if (labImages !== undefined) labUpdateData.labImages = labImages;
      if (institutionImages !== undefined) labUpdateData.institutionImages = institutionImages;

      return await tx.labs.update({
        where: { id: labId },
        data: labUpdateData,
        include: {
          user: {
            select: {
              userName: true,
              email: true,
              phoneNumber: true,
              altPhoneNumber: true,
            },
          },
        },
      });
    });

    const mappedLab = mapLabToFrontend(updatedLab);

    return res.status(200).json({
      success: true,
      message: "Lab updated successfully",
      data: mappedLab,
    });
  } catch (error) {
    console.error("❌ Error in updateLab:", error);
    const errorObj: AppErrorPayload = {
      fnc: "updateLab",
      error,
    };
    throw new AppError(errorObj);
  }
};
