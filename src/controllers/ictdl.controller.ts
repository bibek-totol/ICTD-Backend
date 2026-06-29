import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.config';
import { AppError } from '../utils/AppError.util';
import { AppErrorPayload } from '../interfaces_and_types/AppError.interface';
import AppRequest from '../interfaces_and_types/AppRequest.interface';
import { normalizeJurisdiction } from '../utils/jurisdiction.util';
import {
  buildRoleScope,
  applyJurisdictionFilters,
  buildSearchClause,
  consolidateImages,
  deleteCloudinaryImages,
  checkJurisdictionAccess,
} from '../utils/labQuery.util';

export const getICTDLLabs = async (req: Request, res: Response) => {
  try {
    const { division, district, upazila, search, page = '1', limit = '25' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = buildRoleScope((req as AppRequest).user);
    applyJurisdictionFilters(where, { division, district, upazila });
    if (search) where.OR = buildSearchClause(search as string);

    const [labs, totalCount] = await Promise.all([
      prisma.ictdl_labs.findMany({ where, skip, take, orderBy: { id: 'asc' } }),
      prisma.ictdl_labs.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'ICTDL labs retrieved successfully',
      data: labs,
      totalCount,
      page: parseInt(page as string),
      limit: take,
    });
  } catch (error) {
    throw new AppError({ fnc: 'getICTDLLabs', error } as AppErrorPayload);
  }
};

export const getICTDLLabsPublic = async (req: Request, res: Response) => {
  try {
    const { division, district, upazila, search, page = '1', limit = '25' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    applyJurisdictionFilters(where, { division, district, upazila });
    if (search) where.OR = buildSearchClause(search as string);

    const [labs, totalCount] = await Promise.all([
      prisma.ictdl_labs.findMany({ where, skip, take, orderBy: { id: 'asc' } }),
      prisma.ictdl_labs.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Public ICTDL labs retrieved successfully',
      data: labs,
      totalCount,
      page: parseInt(page as string),
      limit: take,
    });
  } catch (error) {
    throw new AppError({ fnc: 'getICTDLLabsPublic', error } as AppErrorPayload);
  }
};

export const getICTDLabById = async (req: Request, res: Response) => {
  try {
    const lab = await prisma.ictdl_labs.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!lab) {
      return res.status(404).json({ success: false, message: 'ICTDL lab not found' });
    }

    const accessError = checkJurisdictionAccess((req as AppRequest).user, lab);
    if (accessError) {
      return res.status(403).json({ success: false, message: accessError });
    }

    return res.status(200).json({
      success: true,
      message: 'ICTDL lab retrieved successfully',
      data: lab,
    });
  } catch (error) {
    throw new AppError({ fnc: 'getICTDLabById', error } as AppErrorPayload);
  }
};

export const getICTDLabByIdPublic = async (req: Request, res: Response) => {
  try {
    const lab = await prisma.ictdl_labs.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!lab) {
      return res.status(404).json({ success: false, message: 'ICTDL lab not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Public ICTDL lab retrieved successfully',
      data: lab,
    });
  } catch (error) {
    throw new AppError({ fnc: 'getICTDLabByIdPublic', error } as AppErrorPayload);
  }
};

export const updateICTDLab = async (req: Request, res: Response) => {
  try {
    const labId = parseInt(req.params.id);
    const { division, district, upazila, head, email, mobile, lat, long, deletedImages } = req.body;
    const files = (req as any).files;
    const userAuth = (req as AppRequest).user;

    const lab = await prisma.ictdl_labs.findUnique({ where: { id: labId } });
    if (!lab) {
      return res.status(404).json({ success: false, message: 'ICTDL lab not found' });
    }

    const accessError = checkJurisdictionAccess(userAuth, lab);
    if (accessError) {
      return res.status(403).json({ success: false, message: accessError });
    }

    const labImages = consolidateImages('labImages', req.body, files);
    const institutionImages = consolidateImages('institutionImages', req.body, files);

    // Cloudinary cleanup before update
    await deleteCloudinaryImages(
      deletedImages,
      new Set([...(lab.labImages ?? []), ...(lab.institutionImages ?? [])]),
      [labImages, institutionImages],
    );

    const updateData: any = {};

    // Only SuperAdmin can shift jurisdiction
    if (userAuth?.role === 'SuperAdmin') {
      if (division !== undefined) updateData.division = division;
      if (district !== undefined) updateData.district = district;
      if (upazila !== undefined) updateData.upazila = upazila;
    }
    if (head !== undefined) updateData.head = head;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (lat !== undefined) updateData.lat = parseFloat(lat);
    if (long !== undefined) updateData.long = parseFloat(long);
    if (labImages !== undefined) updateData.labImages = labImages;
    if (institutionImages !== undefined) updateData.institutionImages = institutionImages;

    const updatedLab = await prisma.ictdl_labs.update({
      where: { id: labId },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'ICTDL lab updated successfully',
      data: updatedLab,
    });
  } catch (error) {
    throw new AppError({ fnc: 'updateICTDLab', error } as AppErrorPayload);
  }
};

export const getICTDLFilterOptions = async (req: Request, res: Response) => {
  try {
    const where: any = buildRoleScope((req as AppRequest).user);
    applyJurisdictionFilters(where, { division: req.query.division, district: req.query.district });

    const [divisions, districts, upazilas] = await Promise.all([
      prisma.ictdl_labs.findMany({
        distinct: ['division'],
        select: { division: true },
        where: { AND: [where, { division: { not: null, notIn: ['', ' ', 'null', 'NULL'] } }] },
        orderBy: { division: 'asc' },
      }),
      prisma.ictdl_labs.findMany({
        distinct: ['district'],
        select: { district: true },
        where: { AND: [where, { district: { notIn: ['', ' ', 'null', 'NULL'] } }] },
        orderBy: { district: 'asc' },
      }),
      prisma.ictdl_labs.findMany({
        distinct: ['upazila'],
        select: { upazila: true },
        where: { AND: [where, { upazila: { notIn: ['', ' ', 'null', 'NULL'] } }] },
        orderBy: { upazila: 'asc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'ICTDL filter options retrieved successfully',
      data: {
        divisions: divisions.map((d: any) => d.division).filter(Boolean),
        districts: districts.map((d: any) => d.district).filter(Boolean),
        upazilas: upazilas.map((u: any) => u.upazila).filter(Boolean),
      },
    });
  } catch (error) {
    throw new AppError({ fnc: 'getICTDLFilterOptions', error } as AppErrorPayload);
  }
};

export const getICTDLFilterOptionsPublic = async (req: Request, res: Response) => {
  try {
    const [divisions, districts, upazilas] = await Promise.all([
      prisma.ictdl_labs.findMany({
        distinct: ['division'],
        select: { division: true },
        where: { division: { not: null, notIn: ['', ' ', 'null', 'NULL'] } },
        orderBy: { division: 'asc' },
      }),
      prisma.ictdl_labs.findMany({
        distinct: ['district'],
        select: { district: true },
        where: { district: { notIn: ['', ' ', 'null', 'NULL'] } },
        orderBy: { district: 'asc' },
      }),
      prisma.ictdl_labs.findMany({
        distinct: ['upazila'],
        select: { upazila: true },
        where: { upazila: { notIn: ['', ' ', 'null', 'NULL'] } },
        orderBy: { upazila: 'asc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Public ICTDL filter options retrieved successfully',
      data: {
        divisions: divisions.map((d: any) => d.division).filter(Boolean),
        districts: districts.map((d: any) => d.district).filter(Boolean),
        upazilas: upazilas.map((u: any) => u.upazila).filter(Boolean),
      },
    });
  } catch (error) {
    throw new AppError({ fnc: 'getICTDLFilterOptionsPublic', error } as AppErrorPayload);
  }
};

export const bulkICTDLInsert = async (req: Request, res: Response) => {
  try {
    const { labs } = req.body as any;

    if (!Array.isArray(labs)) {
      return res.status(400).json({ success: false, message: 'labs field must be an array' });
    }

    const result = await prisma.ictdl_labs.createMany({
      data: labs.map((lab: any) => ({
        division: lab.division ?? null,
        district: lab.district ?? 'Unknown',
        upazila: lab.upazila ?? 'Unknown',
        institute: lab.institute ?? 'Unknown',
        head: lab.head ?? 'Unknown',
        mobile: lab.mobile != null ? String(lab.mobile) : 'Unknown',
        email: lab.email ?? null,
        lat: parseFloat(lab.lat) || 0,
        long: parseFloat(lab.long) || 0,
        labImages: [],
        institutionImages: [],
      })),
      skipDuplicates: true,
    });

    return res.status(201).json({
      success: true,
      message: `${result.count} ICTDL labs inserted successfully`,
      data: result,
    });
  } catch (error) {
    throw new AppError({ fnc: 'bulkICTDLInsert', error } as AppErrorPayload);
  }
};
