import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import { AppError } from "../utils/AppError.util";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";

const parseBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value !== "false";
  return true;
};

const parseSerial = (value: unknown) => {
  const serial = Number(value);
  return Number.isFinite(serial) ? serial : 0;
};

export const createVendor = async (req: Request, res: Response) => {
  try {
    const { name, address, phone, serial, isActive } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({
        success: false,
        message: "Vendor name, address, and phone are required",
      });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        address,
        phone,
        serial: parseSerial(serial),
        isActive: parseBoolean(isActive),
      },
    });

    res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: vendor,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "createVendor", error };
    throw new AppError(errorObj);
  }
};

export const getVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: [{ serial: "asc" }, { createdAt: "desc" }],
    });

    res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "getVendors", error };
    throw new AppError(errorObj);
  }
};

export const getActiveVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      orderBy: [{ serial: "asc" }, { createdAt: "desc" }],
    });

    res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "getActiveVendors", error };
    throw new AppError(errorObj);
  }
};

export const updateVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, phone, serial, isActive } = req.body;

    const existing = await prisma.vendor.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const updated = await prisma.vendor.update({
      where: { id: parseInt(id, 10) },
      data: {
        name: name ?? undefined,
        address: address ?? undefined,
        phone: phone ?? undefined,
        serial: serial !== undefined ? parseSerial(serial) : undefined,
        isActive: isActive !== undefined ? parseBoolean(isActive) : undefined,
      },
    });

    res.status(200).json({
      success: true,
      message: "Vendor updated successfully",
      data: updated,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "updateVendor", error };
    throw new AppError(errorObj);
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.vendor.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    await prisma.vendor.delete({
      where: { id: parseInt(id, 10) },
    });

    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "deleteVendor", error };
    throw new AppError(errorObj);
  }
};
