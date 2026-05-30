import { Request, Response } from "express";
import { prisma } from "../configs/prisma.config";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";
import { AppError } from "../utils/AppError.util";

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const createContactMessage = async (req: Request, res: Response) => {
  try {
    const firstName = normalizeText(req.body.firstName);
    const lastName = normalizeText(req.body.lastName);
    const email = normalizeText(req.body.email);
    const phone = normalizeText(req.body.phone);
    const subject = normalizeText(req.body.subject);
    const message = normalizeText(req.body.message);

    if (!firstName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "First name, email, subject, and message are required",
      });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        firstName,
        lastName: lastName || null,
        email,
        phone: phone || null,
        subject,
        message,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: contactMessage,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "createContactMessage", error };
    throw new AppError(errorObj);
  }
};

export const getContactMessages = async (_req: Request, res: Response) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Contact messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "getContactMessages", error };
    throw new AppError(errorObj);
  }
};

export const updateContactMessageStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const status = normalizeText(req.body.status) || "Read";

    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Invalid message id" });
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: "Message status updated successfully",
      data: updated,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "updateContactMessageStatus", error };
    throw new AppError(errorObj);
  }
};

export const deleteContactMessage = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Invalid message id" });
    }

    await prisma.contactMessage.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: "deleteContactMessage", error };
    throw new AppError(errorObj);
  }
};
