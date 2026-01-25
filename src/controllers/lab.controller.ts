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
});

export const getLabs = async (req: Request, res: Response) => {
  try {
    console.log("🔍 getLabs called with query:", req.query);

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

    console.log("🔍 Where clause:", JSON.stringify(whereClause, null, 2));

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

    console.log(`✅ Found ${labs.length} labs`);

    const mappedLabs = labs.map(mapLabToFrontend);

    return res.status(200).json({
      success: true,
      message: "Labs retrieved successfully",
      data: mappedLabs,
      count: mappedLabs.length,
    });
  } catch (error) {
    console.error("❌ Error in getLabs:", error);
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
    console.log("🔍 getFilterOptions called");

    const divisions = await prisma.labs.findMany({
      distinct: ["division"],
      select: {
        division: true,
      },
      where: {
        division: {
          not: null,
        },
      },
      orderBy: {
        division: "asc",
      },
    });

    const upazilas = await prisma.labs.findMany({
      distinct: ["upazila"],
      select: {
        upazila: true,
      },
      where: {
        upazila: {
          not: null,
        },
      },
      orderBy: {
        upazila: "asc",
      },
    });

    const labTypes = await prisma.labs.findMany({
      distinct: ["lab_type"],
      select: {
        lab_type: true,
      },
      where: {
        lab_type: {
          not: null,
        },
      },
      orderBy: {
        lab_type: "asc",
      },
    });

    console.log("✅ Filter options retrieved successfully");

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
    console.error("❌ Error in getFilterOptions:", error);
    const errorObj: AppErrorPayload = {
      fnc: "getFilterOptions",
      error,
    };
    throw new AppError(errorObj);
  }
};

export const newGetLabs = async (req: Request, res: Response) => {
  try {
    const labs = await prisma.labs.findMany({
      select: {
        id: true,
        division: true,
        seat: true,
        upazila: true,
        institute: true,
        lab_type: true,
        lat: true,
        long: true,

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

    const outputData = [];

    for (let lab of labs) {
      outputData.push(new ShapeData(lab));
    }

    return res.status(200).json({
      success: true,
      message: "Labs retrieved successfully",
      data: outputData,
      count: outputData.length,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = {
      fnc: "newGetLabs",
      error,
    };
    throw new AppError(errorObj);
  }
};
