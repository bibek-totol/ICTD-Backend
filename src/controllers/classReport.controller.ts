import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import AppRequest from "../interfaces_and_types/AppRequest.interface";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import { AppError } from "../utils/AppError.util";
import { normalizeJurisdiction } from "../utils/jurisdiction.util";

const parseDetails = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value as Record<string, unknown>;
};

const parseCount = (value: unknown) => {
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
};

const buildReportData = (body: any) => {
  const reportDetails = parseDetails(body.reportDetails);

  return {
    instituteAddress: body.instituteAddress || reportDetails?.instituteAddress || null,
    labEstablishedAt: body.labEstablishedAt || reportDetails?.labEstablishedAt || null,
    computerCount: parseCount(body.computerCount ?? reportDetails?.computerCount),
    otherEquipmentCount: body.otherEquipmentCount || reportDetails?.otherEquipmentCount || null,
    digitalLabStatus: body.digitalLabStatus || reportDetails?.digitalLabStatus || null,
    digitalLabStatusDetails: body.digitalLabStatusDetails || reportDetails?.digitalLabStatusDetails || null,
    renovationRouteStatus: body.renovationRouteStatus || reportDetails?.renovationRouteStatus || null,
    renovationRouteStatusDetails: body.renovationRouteStatusDetails || reportDetails?.renovationRouteStatusDetails || null,
    renovationRouteDetails: body.renovationRouteDetails || reportDetails?.renovationRouteStatusDetails || null,
    labClassRegister: body.labClassRegister || reportDetails?.labClassRegister || null,
    labClassRegisterDetails: body.labClassRegisterDetails || reportDetails?.labClassRegisterDetails || null,
    labCameraStatus: body.labCameraStatus || reportDetails?.labCameraStatus || null,
    labCameraStatusDetails: body.labCameraStatusDetails || reportDetails?.labCameraStatusDetails || null,
    internetConnectionStatus: body.internetConnectionStatus || reportDetails?.internetConnectionStatus || null,
    internetConnectionStatusDetails: body.internetConnectionStatusDetails || reportDetails?.internetConnectionStatusDetails || null,
    internetConnectionDetails: body.internetConnectionDetails || reportDetails?.internetConnectionStatusDetails || null,
    sofRoboticsStatus: body.sofRoboticsStatus || reportDetails?.sofRoboticsStatus || null,
    currentStatus: body.currentStatus || reportDetails?.currentStatus || null,
    reportSummary: body.reportSummary || null,
    reportDetails,
  };
};

const getScopedWhereClause = (req: Request) => {
  const { division, district, upazila, labType, search } = req.query;
  const userAuth = (req as AppRequest).user;

  const labClause: any = {};
  const ictdlClause: any = {};

  if (userAuth?.role !== "SuperAdmin") {
    if (userAuth?.role === "DistrictAdmin") {
      if (userAuth.district) {
        labClause.district = { in: normalizeJurisdiction(userAuth.district) };
        ictdlClause.district = { in: normalizeJurisdiction(userAuth.district) };
      }
    } else if (userAuth?.role === "DivisionAdmin") {
      if (userAuth.division) {
        labClause.division = { in: normalizeJurisdiction(userAuth.division) };
        ictdlClause.division = { in: normalizeJurisdiction(userAuth.division) };
      }
    } else if (userAuth?.role === "LabAdmin") {
      if (userAuth.email) {
        labClause.email = { equals: userAuth.email, mode: "insensitive" };
        ictdlClause.email = { equals: userAuth.email, mode: "insensitive" };
      } else {
        labClause.id = -1;
        ictdlClause.id = -1;
      }
    } else {
      if (userAuth?.division) {
        labClause.division = { in: normalizeJurisdiction(userAuth.division) };
        ictdlClause.division = { in: normalizeJurisdiction(userAuth.division) };
      }
      if (userAuth?.district) {
        labClause.district = { in: normalizeJurisdiction(userAuth.district) };
        ictdlClause.district = { in: normalizeJurisdiction(userAuth.district) };
      }
      if (userAuth?.upazila) {
        labClause.upazila = { in: normalizeJurisdiction(userAuth.upazila) };
        ictdlClause.upazila = { in: normalizeJurisdiction(userAuth.upazila) };
      }
    }
  }

  if (division && division !== "All") {
    labClause.division = labClause.division || (division as string);
    ictdlClause.division = ictdlClause.division || (division as string);
  }

  if (district && district !== "All") {
    labClause.district = labClause.district || (district as string);
    ictdlClause.district = ictdlClause.district || (district as string);
  }

  if (upazila && upazila !== "All") {
    labClause.upazila = labClause.upazila || { in: normalizeJurisdiction(upazila as string) };
    ictdlClause.upazila = ictdlClause.upazila || { in: normalizeJurisdiction(upazila as string) };
  }

  if (labType && labType !== "All") {
    if (labType === "ictdl") {
      labClause.id = -1;
    } else {
      labClause.lab_type = labClause.lab_type || (labType as string);
      ictdlClause.id = -1;
    }
  }

  const andClause: any[] = [];

  if (Object.keys(labClause).length > 0 || Object.keys(ictdlClause).length > 0) {
    andClause.push({
      OR: [
        { lab: { ...labClause } },
        { ictdlLab: { ...ictdlClause } },
      ],
    });
  }

  if (search) {
    andClause.push({
      OR: [
        { lab: { institute: { contains: search as string, mode: "insensitive" } } },
        { ictdlLab: { institute: { contains: search as string, mode: "insensitive" } } },
        { lab: { division: { contains: search as string, mode: "insensitive" } } },
        { ictdlLab: { division: { contains: search as string, mode: "insensitive" } } },
        { lab: { district: { contains: search as string, mode: "insensitive" } } },
        { ictdlLab: { district: { contains: search as string, mode: "insensitive" } } },
        { lab: { upazila: { contains: search as string, mode: "insensitive" } } },
        { ictdlLab: { upazila: { contains: search as string, mode: "insensitive" } } },
      ],
    });
  }

  return andClause.length ? { AND: andClause } : {};
};

const mapClassReport = (report: any) => {
  const lab = report.lab || report.ictdlLab;
  if (!lab) return null;

  return {
    id: report.id,
    reportType: "class",
    labId: report.labId || report.ictdlLabId,
    institute: lab.institute,
    division: lab.division,
    district: lab.district,
    upazila: lab.upazila,
    labType: report.ictdlLabId ? "ictdl" : (lab.lab_type || "sof"),
    head: lab.user?.userName || lab.head,
    submittedByUserId: report.submittedByUserId,
    submittedBy: report.submittedBy ? {
      id: report.submittedBy.id,
      userName: report.submittedBy.userName,
      email: report.submittedBy.email,
      role: report.submittedBy.role,
    } : null,
    submittedByName: report.submittedBy?.userName || report.submittedBy?.email || "Unknown",
    submittedByEmail: report.submittedBy?.email || "",
    basicRobotics: report.computerCount,
    advancedRobotics: 0,
    "3dPrinter": 0,
    vrHeadset: 0,
    networkCamera: 0,
    ups: 0,
    isFunctional: report.digitalLabStatus,
    damageDetails: report.reportSummary,
    recommendations: report.currentStatus,
    instituteAddress: report.instituteAddress,
    labEstablishedAt: report.labEstablishedAt,
    computerCount: report.computerCount,
    otherEquipmentCount: report.otherEquipmentCount,
    digitalLabStatus: report.digitalLabStatus,
    digitalLabStatusDetails: report.digitalLabStatusDetails,
    renovationRouteStatus: report.renovationRouteStatus,
    renovationRouteStatusDetails: report.renovationRouteStatusDetails || report.renovationRouteDetails,
    labClassRegister: report.labClassRegister,
    labClassRegisterDetails: report.labClassRegisterDetails,
    labCameraStatus: report.labCameraStatus,
    labCameraStatusDetails: report.labCameraStatusDetails,
    internetConnectionStatus: report.internetConnectionStatus,
    internetConnectionStatusDetails: report.internetConnectionStatusDetails || report.internetConnectionDetails,
    sofRoboticsStatus: report.sofRoboticsStatus,
    currentStatus: report.currentStatus,
    reportSummary: report.reportSummary,
    reportDetails: {
      ...(report.reportDetails || {}),
      instituteAddress: report.instituteAddress,
      labEstablishedAt: report.labEstablishedAt,
      computerCount: report.computerCount,
      otherEquipmentCount: report.otherEquipmentCount,
      digitalLabStatus: report.digitalLabStatus,
      digitalLabStatusDetails: report.digitalLabStatusDetails,
      renovationRouteStatus: report.renovationRouteStatus,
      renovationRouteStatusDetails: report.renovationRouteStatusDetails || report.renovationRouteDetails,
      labClassRegister: report.labClassRegister,
      labClassRegisterDetails: report.labClassRegisterDetails,
      labCameraStatus: report.labCameraStatus,
      labCameraStatusDetails: report.labCameraStatusDetails,
      internetConnectionStatus: report.internetConnectionStatus,
      internetConnectionStatusDetails: report.internetConnectionStatusDetails || report.internetConnectionDetails,
      sofRoboticsStatus: report.sofRoboticsStatus,
      currentStatus: report.currentStatus,
    },
    createdAt: report.createdAt,
  };
};

export const createClassReport = async (req: Request, res: Response) => {
  try {
    const { labId, labType } = req.body;

    if (!labId) {
      return res.status(400).json({ success: false, message: "labId is required" });
    }

    const data: any = buildReportData(req.body);
    const submittedByUserId = (req as AppRequest).user?.userId;
    if (submittedByUserId) data.submittedByUserId = submittedByUserId;

    if (labType === "ictdl") {
      data.ictdlLabId = parseInt(labId, 10);
    } else {
      data.labId = parseInt(labId, 10);
    }

    const report = await prisma.classReport.create({ data });

    return res.status(201).json({
      success: true,
      message: "Class report submitted successfully",
      data: report,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "createClassReport", error };
    throw new AppError(errorObj);
  }
};

export const getClassReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.classReport.findMany({
      where: getScopedWhereClause(req),
      include: {
        lab: {
          include: {
            user: {
              select: { userName: true },
            },
          },
        },
        ictdlLab: true,
        submittedBy: {
          select: {
            id: true,
            userName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Class reports retrieved successfully",
      data: reports.map(mapClassReport).filter(Boolean),
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "getClassReports", error };
    throw new AppError(errorObj);
  }
};

export const updateClassReport = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Invalid report id" });
    }

    const data = buildReportData(req.body);
    const report = await prisma.classReport.update({
      where: { id },
      data,
      include: {
        lab: {
          include: {
            user: {
              select: { userName: true },
            },
          },
        },
        ictdlLab: true,
        submittedBy: {
          select: {
            id: true,
            userName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Class report updated successfully",
      data: mapClassReport(report),
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "updateClassReport", error };
    throw new AppError(errorObj);
  }
};

export const deleteClassReport = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Invalid report id" });
    }

    await prisma.classReport.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Class report deleted successfully",
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "deleteClassReport", error };
    throw new AppError(errorObj);
  }
};
