import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import { AppError } from "../utils/AppError.util";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import { LabTypes } from "@prisma/client";
import cloudinary from "../configs/cloudinary.config";
import AppRequest from "../interfaces_and_types/AppRequest.interface";

import { normalizeJurisdiction } from "../utils/jurisdiction.util";
import { t } from "../utils/translate.util";

const mapLabToFrontend = (lab: any) => ({
  id: lab.id,
  institute: lab.institute,
  division: lab.division,
  district: lab.district,
  upazila: lab.upazila,
  seat: lab.seat,
  head: lab.user?.userName ?? lab.head,
  mobile: lab.user?.phoneNumber ?? lab.mobile,
  altMobile: lab.altPhoneNumber ?? lab.alt_mobile,
  email: lab.user?.email ?? lab.email,
  labType: lab.lab_type,
  lat: lab.lat,
  long: lab.long,
  labImages: lab.labImages ?? [],
  institutionImages: lab.institutionImages ?? [],
});

export const getLabs = async (req: AppRequest, res: Response) => {
  try {
    const { division, district, upazila, labType, search } = req.query;
    const user = req.user;

    const whereClause: any = {};

    // Professional Scoping & Language Normalization
    if (user?.role !== "SuperAdmin") {
      if (user?.role === "DistrictAdmin") {
        if (user.district) {
          whereClause.district = { in: normalizeJurisdiction(user.district) };
        }
      } else if (user?.role === "DivisionAdmin") {
        if (user.division) {
          whereClause.division = { in: normalizeJurisdiction(user.division) };
        }
      } else if (user?.role === "LabAdmin") {
        if (user.email) {
          whereClause.email = { equals: user.email, mode: "insensitive" };
        } else {
          whereClause.id = -1;
        }
      } else {
        // More specific roles (Upazila/etc)
        if (user?.division) whereClause.division = { in: normalizeJurisdiction(user.division) };
        if (user?.district) whereClause.district = { in: normalizeJurisdiction(user.district) };
        if (user?.upazila) whereClause.upazila = user.upazila;
      }
    }

    // Secondary Filters (Query params)
    if (division && division !== "All") {
      const normalized = normalizeJurisdiction(division as string);
      whereClause.division = { in: normalized };
    }

    if (district && district !== "All") {
      const normalized = normalizeJurisdiction(district as string);
      whereClause.district = { in: normalized };
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
        { head: { contains: search as string, mode: "insensitive" } },
        { user: { userName: { contains: search as string, mode: "insensitive" } } },
        { user: { email: { contains: search as string, mode: "insensitive" } } },
        { user: { phoneNumber: { contains: search as string, mode: "insensitive" } } },
        { division: { contains: search as string, mode: "insensitive" } },
        { district: { contains: search as string, mode: "insensitive" } },
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
      message: t("labs_retrieved", req.lang),
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

export const getLabById = async (req: AppRequest, res: Response) => {
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

    // Jurisdiction & Role Check
    const userAuth = req.user;
    if (userAuth?.role !== "SuperAdmin") {
      if (userAuth?.role === "LabAdmin") {
        if (!lab.email || lab.email.toLowerCase() !== userAuth.email?.toLowerCase()) {
          return res.status(403).json({ success: false, message: "Access denied: this is not your lab" });
        }
      } else {

        const normalizedDiv = userAuth?.division ? normalizeJurisdiction(userAuth.division) : [];
        const normalizedDist = userAuth?.district ? normalizeJurisdiction(userAuth.district) : [];

        if (userAuth?.division && !normalizedDiv.includes((lab.division as string) || "")) {
          return res.status(403).json({ success: false, message: "Access denied: outside your division" });
        }
        if (userAuth?.district && !normalizedDist.includes((lab.district as string) || "")) {
          return res.status(403).json({ success: false, message: "Access denied: outside your district" });
        }
        if (userAuth?.upazila && lab.upazila !== userAuth.upazila) {
          return res.status(403).json({ success: false, message: "Access denied: outside your upazila" });
        }
      }
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

export const getFilterOptions = async (req: AppRequest, res: Response) => {
  try {
    const user = req.user;
    const where: any = {};

    if (user?.role !== "SuperAdmin") {
      if (user?.role === "DistrictAdmin" && user.district) {
        where.district = { in: normalizeJurisdiction(user.district) };
      } else if (user?.role === "DivisionAdmin" && user.division) {
        where.division = { in: normalizeJurisdiction(user.division) };
      } else if (user?.role === "LabAdmin") {
        if (user.email) {
          where.email = { equals: user.email, mode: "insensitive" };
        } else {
          where.id = -1;
        }
      } else {
        if (user?.division) where.division = { in: normalizeJurisdiction(user.division) };
        if (user?.district) where.district = { in: normalizeJurisdiction(user.district) };
        if (user?.upazila) where.upazila = user.upazila;
      }
    }

    const divisions = await prisma.labs.findMany({
      distinct: ["division"],
      select: { division: true },
      where: { ...where, division: { not: null, notIn: ["", " "] } },
      orderBy: { division: "asc" },
    });

    const districts = await prisma.labs.findMany({
      distinct: ["district"],
      select: { district: true },
      where: { ...where, district: { not: null, notIn: ["", " "] } },
      orderBy: { district: "asc" },
    });

    const upazilas = await prisma.labs.findMany({
      distinct: ["upazila"],
      select: { upazila: true },
      where: { ...where, upazila: { not: null, notIn: ["", " "] } },
      orderBy: { upazila: "asc" },
    });

    const labTypes = await prisma.labs.findMany({
      distinct: ["lab_type"],
      select: { lab_type: true },
      where: { ...where, lab_type: { not: null } },
      orderBy: { lab_type: "asc" },
    });

    return res.status(200).json({
      success: true,
      message: "Filter options retrieved successfully",
      data: {
        divisions: divisions.map((d) => d.division).filter(Boolean),
        districts: districts.map((d) => d.district).filter(Boolean),
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

export const getLabsPublic = async (req: Request, res: Response) => {
  try {
    const { division, district, upazila, labType, search } = req.query;
    const whereClause: any = {};

    if (division && division !== "All") {
      const normalized = normalizeJurisdiction(division as string);
      whereClause.division = { in: normalized };
    }
    if (district && district !== "All") {
      const normalized = normalizeJurisdiction(district as string);
      whereClause.district = { in: normalized };
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
        { head: { contains: search as string, mode: "insensitive" } },
        { user: { userName: { contains: search as string, mode: "insensitive" } } },
        { user: { email: { contains: search as string, mode: "insensitive" } } },
        { user: { phoneNumber: { contains: search as string, mode: "insensitive" } } },
        { division: { contains: search as string, mode: "insensitive" } },
        { district: { contains: search as string, mode: "insensitive" } },
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
      orderBy: { id: "asc" },
    });

    const mappedLabs = labs.map(mapLabToFrontend);
    return res.status(200).json({
      success: true,
      message: t("labs_retrieved", (req as any).lang),
      data: mappedLabs,
      count: mappedLabs.length,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "getLabsPublic", error };
    throw new AppError(errorObj);
  }
};

export const getLabByIdPublic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lab = await prisma.labs.findUnique({
      where: { id: parseInt(id as string) },
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
      return res.status(404).json({ success: false, message: "Lab not found" });
    }

    const mappedLab = mapLabToFrontend(lab);
    return res.status(200).json({
      success: true,
      message: "Public lab retrieved successfully",
      data: mappedLab,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "getLabByIdPublic", error };
    throw new AppError(errorObj);
  }
};

export const getFilterOptionsPublic = async (req: Request, res: Response) => {
  try {
    const divisions = await prisma.labs.findMany({
      distinct: ["division"],
      select: { division: true },
      where: { division: { not: null, notIn: ["", " "] } },
      orderBy: { division: "asc" },
    });

    const districts = await prisma.labs.findMany({
      distinct: ["district"],
      select: { district: true },
      where: { district: { not: null, notIn: ["", " "] } },
      orderBy: { district: "asc" },
    });

    const upazilas = await prisma.labs.findMany({
      distinct: ["upazila"],
      select: { upazila: true },
      where: { upazila: { not: null, notIn: ["", " "] } },
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
      message: "Public filter options retrieved successfully",
      data: {
        divisions: divisions.map((d) => d.division).filter(Boolean),
        districts: districts.map((d) => d.district).filter(Boolean),
        upazilas: upazilas.map((u) => u.upazila).filter(Boolean),
        labTypes: labTypes.map((l) => l.lab_type).filter(Boolean),
      },
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "getFilterOptionsPublic", error };
    throw new AppError(errorObj);
  }
};

export const updateLab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { division, district, upazila, seat, head, email, mobile, alt_mobile, lat, long, deletedImages } = req.body;
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

    // Jurisdiction & Role Check
    const userAuth = (req as AppRequest).user;
    if (userAuth?.role !== "SuperAdmin") {
      if (userAuth?.role === "LabAdmin") {
        if (!lab.email || lab.email.toLowerCase() !== userAuth.email?.toLowerCase()) {
          return res.status(403).json({ success: false, message: "Access denied: this is not your lab" });
        }
      } else if (userAuth?.role === "DistrictAdmin") {
        const normalizedDist = userAuth.district ? normalizeJurisdiction(userAuth.district) : [];
        if (!normalizedDist.includes(lab.district || "")) {
          return res.status(403).json({ success: false, message: "Unauthorized: outside your district" });
        }
      } else {
        const normalizedDiv = userAuth?.division ? normalizeJurisdiction(userAuth.division) : [];
        const normalizedDist = userAuth?.district ? normalizeJurisdiction(userAuth.district) : [];

        if (userAuth?.division && !normalizedDiv.includes(lab.division || "")) {
          return res.status(403).json({ success: false, message: "Unauthorized: outside your division" });
        }
        if (userAuth?.district && !normalizedDist.includes(lab.district || "")) {
          return res.status(403).json({ success: false, message: "Unauthorized: outside your district" });
        }
        if (userAuth?.upazila && lab.upazila !== userAuth.upazila) {
          return res.status(403).json({ success: false, message: "Unauthorized: outside your upazila" });
        }
      }
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

      if (Object.keys(userUpdateData).length > 0 && lab.userId) {
        await tx.user.update({
          where: { id: lab.userId },
          data: userUpdateData,
        });
      }

      // 2. Update Lab record
      const labUpdateData: any = {};

      // Only SuperAdmin can change jurisdiction
      if (userAuth?.role === "SuperAdmin") {
        if (division !== undefined) labUpdateData.division = division;
        if (district !== undefined) labUpdateData.district = district;
        if (upazila !== undefined) labUpdateData.upazila = upazila;
      }

      if (seat !== undefined) labUpdateData.seat = seat;
      if (lat !== undefined) labUpdateData.lat = parseFloat(lat);
      if (long !== undefined) labUpdateData.long = parseFloat(long);
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

export const getAllLabsUnified = async (req: AppRequest, res: Response) => {
  try {
    const userAuth = req.user;
    const where: any = {};

    if (userAuth?.role !== "SuperAdmin") {
      if (userAuth?.role === "DistrictAdmin") {
        if (userAuth.district) where.district = { in: normalizeJurisdiction(userAuth.district) };
      } else if (userAuth?.role === "DivisionAdmin") {
        if (userAuth.division) where.division = { in: normalizeJurisdiction(userAuth.division) };
      } else if (userAuth?.role === "LabAdmin") {
        if (userAuth.email) {
          where.email = { equals: userAuth.email, mode: "insensitive" };
        } else {
          where.id = -1;
        }
      } else {
        if (userAuth?.division) where.division = { in: normalizeJurisdiction(userAuth.division) };
        if (userAuth?.district) where.district = { in: normalizeJurisdiction(userAuth.district) };
        if (userAuth?.upazila) where.upazila = userAuth.upazila;
      }
    }

    const labs = await prisma.labs.findMany({
      where,
      select: {
        id: true,
        institute: true,
        division: true,
        district: true,
        upazila: true,
      },
    });

    const ictdlLabs = await prisma.ictdl_labs.findMany({
      where,
      select: {
        id: true,
        institute: true,
        division: true,
        district: true,
        upazila: true,
      },
    });

    const unifiedLabs = [
      ...labs.map((l) => ({
        id: `lab-${l.id}`,
        institute: l.institute || "",
        division: l.division || "",
        district: l.district || "",
        upazila: l.upazila || "",
        type: "SRD/SOF",
      })),
      ...ictdlLabs.map((l) => ({
        id: `ictdl-${l.id}`,
        institute: l.institute || "",
        division: l.division || "",
        district: l.district || "",
        upazila: l.upazila || "",
        type: "ICTDL",
      })),
    ];

    return res.status(200).json({
      success: true,
      message: "Unified labs retrieved successfully",
      data: unifiedLabs,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = {
      fnc: "getAllLabsUnified",
      error,
    };
    throw new AppError(errorObj);
  }
};

export const getAllLabsUnifiedPublic = async (req: Request, res: Response) => {
  try {
    const labs = await prisma.labs.findMany({
      select: {
        id: true,
        institute: true,
        division: true,
        district: true,
        upazila: true,
      },
    });

    const ictdlLabs = await prisma.ictdl_labs.findMany({
      select: {
        id: true,
        institute: true,
        division: true,
        district: true,
        upazila: true,
      },
    });

    const unifiedLabs = [
      ...labs.map((l) => ({
        id: `lab-${l.id}`,
        institute: l.institute || "",
        division: l.division || "",
        district: l.district || "",
        upazila: l.upazila || "",
        type: "SRD/SOF",
      })),
      ...ictdlLabs.map((l) => ({
        id: `ictdl-${l.id}`,
        institute: l.institute || "",
        division: l.division || "",
        district: l.district || "",
        upazila: l.upazila || "",
        type: "ICTDL",
      })),
    ];

    return res.status(200).json({
      success: true,
      message: "Public unified labs retrieved successfully",
      data: unifiedLabs,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "getAllLabsUnifiedPublic", error };
    throw new AppError(errorObj);
  }
};

export const bulkLabInsert = async (req: Request, res: Response) => {
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
      district: lab.district || null,
      seat: lab.seat || null,
      upazila: lab.upazila || null,
      institute: lab.institute || null,
      lab_type: (lab.lab_type as LabTypes) || LabTypes.sof,
      head: lab.head || null,
      mobile: lab.mobile ? String(lab.mobile) : null,
      alt_mobile: lab.alt_mobile ? String(lab.alt_mobile) : null,
      email: lab.email || null,
      lat: parseFloat(lab.lat) || 0,
      long: parseFloat(lab.long) || 0,
      labImages: [],
      institutionImages: [],
    }));

    const result = await prisma.labs.createMany({
      data: labsToInsert as any,
      skipDuplicates: true,
    });

    return res.status(201).json({
      success: true,
      message: `${result.count} labs inserted successfully`,
      data: result,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = {
      fnc: "bulkLabInsert",
      error,
    };
    throw new AppError(errorObj);
  }
};
