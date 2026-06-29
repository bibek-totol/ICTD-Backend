import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.config';
import { AppError } from '../utils/AppError.util';
import { AppErrorPayload } from '../interfaces_and_types/AppError.interface';
import { LabTypes } from '@prisma/client';
import AppRequest from '../interfaces_and_types/AppRequest.interface';
import { t } from '../utils/translate.util';
import {
  buildRoleScope,
  applyJurisdictionFilters,
  buildSearchClause,
  consolidateImages,
  deleteCloudinaryImages,
  checkJurisdictionAccess,
} from '../utils/labQuery.util';

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

// Shared include for user fields
const LAB_USER_INCLUDE = {
  user: {
    select: {
      userName: true,
      email: true,
      phoneNumber: true,
      altPhoneNumber: true,
    },
  },
} as const;

export const getLabs = async (req: AppRequest, res: Response) => {
  try {
    const { division, district, upazila, labType, search, page = '1', limit = '25' } = req.query;

    // Build where: role scope + query-param filters + search
    const where: any = buildRoleScope(req.user);
    applyJurisdictionFilters(where, { division, district, upazila, labType });
    if (search) where.OR = buildSearchClause(search as string, true);

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Single parallel query: data + count
    const [labs, totalCount] = await Promise.all([
      prisma.labs.findMany({
        where,
        include: LAB_USER_INCLUDE,
        orderBy: { id: 'asc' },
        skip,
        take,
      }),
      prisma.labs.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: t('labs_retrieved', req.lang),
      data: labs.map(mapLabToFrontend),
      totalCount,
      page: parseInt(page as string),
      limit: take,
    });
  } catch (error) {
    throw new AppError({ fnc: 'getLabs', error } as AppErrorPayload);
  }
};

export const getLabById = async (req: AppRequest, res: Response) => {
  try {
    const lab = await prisma.labs.findUnique({
      where: { id: parseInt(req.params.id) },
      include: LAB_USER_INCLUDE,
    });

    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    const accessError = checkJurisdictionAccess(req.user, lab);
    if (accessError) {
      return res.status(403).json({ success: false, message: accessError });
    }

    return res.status(200).json({
      success: true,
      message: 'Lab retrieved successfully',
      data: mapLabToFrontend(lab),
    });
  } catch (error) {
    throw new AppError({ fnc: 'getLabById', error } as AppErrorPayload);
  }
};

export const getFilterOptions = async (req: AppRequest, res: Response) => {
  try {
    const where: any = buildRoleScope(req.user);
    applyJurisdictionFilters(where, { division: req.query.division, district: req.query.district });

    // One parallel batch instead of 4 sequential queries
    const [divisions, districts, upazilas, labTypes] = await Promise.all([
      prisma.labs.findMany({
        distinct: ['division'],
        select: { division: true },
        where: { AND: [where, { division: { not: null, notIn: ['', ' '] } }] },
        orderBy: { division: 'asc' },
      }),
      prisma.labs.findMany({
        distinct: ['district'],
        select: { district: true },
        where: { AND: [where, { district: { not: null, notIn: ['', ' '] } }] },
        orderBy: { district: 'asc' },
      }),
      prisma.labs.findMany({
        distinct: ['upazila'],
        select: { upazila: true },
        where: { AND: [where, { upazila: { not: null, notIn: ['', ' '] } }] },
        orderBy: { upazila: 'asc' },
      }),
      prisma.labs.findMany({
        distinct: ['lab_type'],
        select: { lab_type: true },
        where: { AND: [where, { lab_type: { not: null } }] },
        orderBy: { lab_type: 'asc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Filter options retrieved successfully',
      data: {
        divisions: divisions.map((d: any) => d.division).filter(Boolean),
        districts: districts.map((d: any) => d.district).filter(Boolean),
        upazilas: upazilas.map((u: any) => u.upazila).filter(Boolean),
        labTypes: labTypes.map((l: any) => l.lab_type).filter(Boolean),
      },
    });
  } catch (error) {
    throw new AppError({ fnc: 'getFilterOptions', error } as AppErrorPayload);
  }
};

export const getUnifiedFilterOptions = async (req: AppRequest, res: Response) => {
  try {
    const where: any = buildRoleScope(req.user);
    applyJurisdictionFilters(where, { division: req.query.division, district: req.query.district });

    const notEmpty = { notIn: ['', ' '] };

    // 4 parallel queries, each merging labs + ictdl_labs via Promise.all
    const [[labsDivs, ictdlDivs], [labsDists, ictdlDists], [labsUpzs, ictdlUpzs], labTypes] =
      await Promise.all([
        Promise.all([
          prisma.labs.findMany({
            distinct: ['division'],
            select: { division: true },
            where: { AND: [where, { division: notEmpty }] },
          }),
          prisma.ictdl_labs.findMany({
            distinct: ['division'],
            select: { division: true },
            where: { AND: [where, { division: notEmpty }] },
          }),
        ]),
        Promise.all([
          prisma.labs.findMany({
            distinct: ['district'],
            select: { district: true },
            where: { AND: [where, { district: notEmpty }] },
          }),
          prisma.ictdl_labs.findMany({
            distinct: ['district'],
            select: { district: true },
            where: { AND: [where, { district: notEmpty }] },
          }),
        ]),
        Promise.all([
          prisma.labs.findMany({
            distinct: ['upazila'],
            select: { upazila: true },
            where: { AND: [where, { upazila: notEmpty }] },
          }),
          prisma.ictdl_labs.findMany({
            distinct: ['upazila'],
            select: { upazila: true },
            where: { AND: [where, { upazila: notEmpty }] },
          }),
        ]),
        prisma.labs.findMany({
          distinct: ['lab_type'],
          select: { lab_type: true },
          where: { AND: [where, { lab_type: { not: null } }] },
        }),
      ]);

    const merge = (a: any[], b: any[], key: string) =>
      [...new Set([...a.map((x) => x[key]), ...b.map((x) => x[key])])].filter(Boolean).sort();

    return res.status(200).json({
      success: true,
      data: {
        divisions: merge(labsDivs, ictdlDivs, 'division'),
        districts: merge(labsDists, ictdlDists, 'district'),
        upazilas: merge(labsUpzs, ictdlUpzs, 'upazila'),
        labTypes: [...new Set([...labTypes.map((l: any) => l.lab_type), 'ictdl'])]
          .filter(Boolean)
          .sort(),
      },
    });
  } catch (error) {
    throw new AppError({ fnc: 'getUnifiedFilterOptions', error } as AppErrorPayload);
  }
};

export const getLabsPublic = async (req: Request, res: Response) => {
  try {
    const { division, district, upazila, labType, search, page = '1', limit = '25' } = req.query;

    const where: any = {};
    applyJurisdictionFilters(where, { division, district, upazila, labType });
    if (search) where.OR = buildSearchClause(search as string, true);

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [labs, totalCount] = await Promise.all([
      prisma.labs.findMany({
        where,
        include: LAB_USER_INCLUDE,
        orderBy: { id: 'asc' },
        skip,
        take,
      }),
      prisma.labs.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: t('labs_retrieved', (req as any).lang),
      data: labs.map(mapLabToFrontend),
      totalCount,
      page: parseInt(page as string),
      limit: take,
    });
  } catch (error) {
    throw new AppError({ fnc: 'getLabsPublic', error } as AppErrorPayload);
  }
};

export const getLabByIdPublic = async (req: Request, res: Response) => {
  try {
    const lab = await prisma.labs.findUnique({
      where: { id: parseInt(req.params.id) },
      include: LAB_USER_INCLUDE,
    });

    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Public lab retrieved successfully',
      data: mapLabToFrontend(lab),
    });
  } catch (error) {
    throw new AppError({ fnc: 'getLabByIdPublic', error } as AppErrorPayload);
  }
};

export const getFilterOptionsPublic = async (req: Request, res: Response) => {
  try {
    const [divisions, districts, upazilas, labTypes] = await Promise.all([
      prisma.labs.findMany({
        distinct: ['division'],
        select: { division: true },
        where: { division: { not: null, notIn: ['', ' '] } },
        orderBy: { division: 'asc' },
      }),
      prisma.labs.findMany({
        distinct: ['district'],
        select: { district: true },
        where: { district: { not: null, notIn: ['', ' '] } },
        orderBy: { district: 'asc' },
      }),
      prisma.labs.findMany({
        distinct: ['upazila'],
        select: { upazila: true },
        where: { upazila: { not: null, notIn: ['', ' '] } },
        orderBy: { upazila: 'asc' },
      }),
      prisma.labs.findMany({
        distinct: ['lab_type'],
        select: { lab_type: true },
        where: { lab_type: { not: null } },
        orderBy: { lab_type: 'asc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Public filter options retrieved successfully',
      data: {
        divisions: divisions.map((d: any) => d.division).filter(Boolean),
        districts: districts.map((d: any) => d.district).filter(Boolean),
        upazilas: upazilas.map((u: any) => u.upazila).filter(Boolean),
        labTypes: labTypes.map((l: any) => l.lab_type).filter(Boolean),
      },
    });
  } catch (error) {
    throw new AppError({ fnc: 'getFilterOptionsPublic', error } as AppErrorPayload);
  }
};

export const updateLab = async (req: Request, res: Response) => {
  try {
    const labId = parseInt(req.params.id);
    const {
      division,
      district,
      upazila,
      seat,
      head,
      email,
      mobile,
      alt_mobile,
      lat,
      long,
      deletedImages,
    } = req.body;
    const files = (req as any).files;
    const userAuth = (req as AppRequest).user;

    const lab = await prisma.labs.findUnique({
      where: { id: labId },
      include: { user: true },
    });

    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    const accessError = checkJurisdictionAccess(userAuth, lab);
    if (accessError) {
      return res.status(403).json({ success: false, message: accessError });
    }

    const labImages = consolidateImages('labImages', req.body, files);
    const institutionImages = consolidateImages('institutionImages', req.body, files);

    // Cloudinary cleanup (fire-and-forget — don't block the update)
    await deleteCloudinaryImages(
      deletedImages,
      new Set([...(lab.labImages ?? []), ...(lab.institutionImages ?? [])]),
      [labImages, institutionImages],
    );

    const updatedLab = await prisma.$transaction(async (tx: any) => {
      // Update linked user record
      const userUpdate: any = {};
      if (head !== undefined) userUpdate.userName = head;
      if (email !== undefined) userUpdate.email = email;
      if (mobile !== undefined) userUpdate.phoneNumber = mobile;
      if (alt_mobile !== undefined) userUpdate.altPhoneNumber = alt_mobile;

      if (Object.keys(userUpdate).length && lab.userId) {
        await tx.user.update({ where: { id: lab.userId }, data: userUpdate });
      }

      // Build lab update payload
      const labUpdate: any = {};
      // Only SuperAdmin can shift jurisdiction
      if (userAuth?.role === 'SuperAdmin') {
        if (division !== undefined) labUpdate.division = division;
        if (district !== undefined) labUpdate.district = district;
        if (upazila !== undefined) labUpdate.upazila = upazila;
      }
      if (seat !== undefined) labUpdate.seat = seat;
      if (lat !== undefined) labUpdate.lat = parseFloat(lat);
      if (long !== undefined) labUpdate.long = parseFloat(long);
      if (labImages !== undefined) labUpdate.labImages = labImages;
      if (institutionImages !== undefined) labUpdate.institutionImages = institutionImages;

      return tx.labs.update({
        where: { id: labId },
        data: labUpdate,
        include: LAB_USER_INCLUDE,
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Lab updated successfully',
      data: mapLabToFrontend(updatedLab),
    });
  } catch (error) {
    console.error('❌ Error in updateLab:', error);
    throw new AppError({ fnc: 'updateLab', error } as AppErrorPayload);
  }
};

export const getAllLabsUnified = async (req: AppRequest, res: Response) => {
  try {
    const where = buildRoleScope(req.user);

    const UNIFIED_SELECT = {
      id: true,
      institute: true,
      division: true,
      district: true,
      upazila: true,
    } as const;

    const [labs, ictdlLabs] = await Promise.all([
      prisma.labs.findMany({ where, select: UNIFIED_SELECT }),
      prisma.ictdl_labs.findMany({ where, select: UNIFIED_SELECT }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Unified labs retrieved successfully',
      data: [
        ...labs.map((l: any) => ({
          id: `lab-${l.id}`,
          ...l,
          institute: l.institute ?? '',
          division: l.division ?? '',
          district: l.district ?? '',
          upazila: l.upazila ?? '',
          type: 'SRD/SOF',
        })),
        ...ictdlLabs.map((l: any) => ({
          id: `ictdl-${l.id}`,
          ...l,
          institute: l.institute ?? '',
          division: l.division ?? '',
          district: l.district ?? '',
          upazila: l.upazila ?? '',
          type: 'ICTDL',
        })),
      ],
    });
  } catch (error) {
    throw new AppError({ fnc: 'getAllLabsUnified', error } as AppErrorPayload);
  }
};

// ─────────────────────────────────────────────
// GET /public/labs/unified
// ─────────────────────────────────────────────

export const getAllLabsUnifiedPublic = async (req: Request, res: Response) => {
  try {
    const UNIFIED_SELECT = {
      id: true,
      institute: true,
      division: true,
      district: true,
      upazila: true,
    } as const;

    const [labs, ictdlLabs] = await Promise.all([
      prisma.labs.findMany({ select: UNIFIED_SELECT }),
      prisma.ictdl_labs.findMany({ select: UNIFIED_SELECT }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Public unified labs retrieved successfully',
      data: [
        ...labs.map((l: any) => ({
          id: `lab-${l.id}`,
          ...l,
          institute: l.institute ?? '',
          division: l.division ?? '',
          district: l.district ?? '',
          upazila: l.upazila ?? '',
          type: 'SRD/SOF',
        })),
        ...ictdlLabs.map((l: any) => ({
          id: `ictdl-${l.id}`,
          ...l,
          institute: l.institute ?? '',
          division: l.division ?? '',
          district: l.district ?? '',
          upazila: l.upazila ?? '',
          type: 'ICTDL',
        })),
      ],
    });
  } catch (error) {
    throw new AppError({ fnc: 'getAllLabsUnifiedPublic', error } as AppErrorPayload);
  }
};

// ─────────────────────────────────────────────
// POST /labs/bulk
// ─────────────────────────────────────────────

export const bulkLabInsert = async (req: Request, res: Response) => {
  try {
    const { labs } = req.body as any;

    if (!Array.isArray(labs)) {
      return res.status(400).json({ success: false, message: 'labs field must be an array' });
    }

    const result = await prisma.labs.createMany({
      data: labs.map((lab: any) => ({
        division: lab.division ?? null,
        district: lab.district ?? null,
        seat: lab.seat ?? null,
        upazila: lab.upazila ?? null,
        institute: lab.institute ?? null,
        lab_type: (lab.lab_type as LabTypes) ?? LabTypes.sof,
        head: lab.head ?? null,
        mobile: lab.mobile != null ? String(lab.mobile) : null,
        alt_mobile: lab.alt_mobile != null ? String(lab.alt_mobile) : null,
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
      message: `${result.count} labs inserted successfully`,
      data: result,
    });
  } catch (error) {
    throw new AppError({ fnc: 'bulkLabInsert', error } as AppErrorPayload);
  }
};
