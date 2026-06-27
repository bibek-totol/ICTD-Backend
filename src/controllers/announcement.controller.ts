import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.config';
import { AppError } from '../utils/AppError.util';
import { AppErrorPayload } from '../interfaces_and_types/AppError.interface';
import cloudinary from '../configs/cloudinary.config';

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, serial, isActive } = req.body;
    const file = req.file;

    let fileUrl = null;
    if (file) {
      fileUrl = (file as any).path;

      // For PDFs, ensure the URL has .pdf extension
      // Note: fl_attachment flag doesn't work for raw resource type
      // The browser will handle PDF display based on Content-Type header
      if (file.mimetype === 'application/pdf' && fileUrl) {
        // Add .pdf extension if not present
        if (!fileUrl.endsWith('.pdf')) {
          fileUrl = fileUrl + '.pdf';
        }
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        serial: serial ? parseInt(serial as string) : 0,
        isActive: isActive === 'false' ? false : true,
        fileUrl,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'createAnnouncement', error };
    throw new AppError(errorObj);
  }
};

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { serial: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'getAnnouncements', error };
    throw new AppError(errorObj);
  }
};

export const getActiveAnnouncements = async (req: Request, res: Response) => {
  try {
    console.log(
      'Prisma models:',
      Object.keys(prisma).filter((k) => !k.startsWith('$')),
    );
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { serial: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'getActiveAnnouncements', error };
    throw new AppError(errorObj);
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, serial, isActive, deleteFile } = req.body;
    const file = req.file;

    const existing = await prisma.announcement.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    let fileUrl = existing.fileUrl;

    if (file) {
      // Delete old file if exists
      if (existing.fileUrl) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = existing.fileUrl.split('/');
          const fileNameWithExt = urlParts[urlParts.length - 1];
          const fileName = fileNameWithExt.split('.')[0];
          const folder = urlParts[urlParts.length - 2];
          const publicId = `${folder}/${fileName}`;

          // Determine resource type (image or raw for PDFs)
          const resourceType = existing.fileUrl.toLowerCase().includes('.pdf') ? 'raw' : 'image';
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (err) {
          console.error('Cloudinary delete error:', err);
        }
      }
      fileUrl = (file as any).path;

      // For PDFs, ensure the URL has .pdf extension
      if (file.mimetype === 'application/pdf' && fileUrl) {
        // Add .pdf extension if not present
        if (!fileUrl.endsWith('.pdf')) {
          fileUrl = fileUrl + '.pdf';
        }
      }
    } else if (deleteFile === 'true' && existing.fileUrl) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = existing.fileUrl.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const fileName = fileNameWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileName}`;

        // Determine resource type (image or raw for PDFs)
        const resourceType = existing.fileUrl.toLowerCase().includes('.pdf') ? 'raw' : 'image';
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      } catch (err) {
        console.error('Cloudinary delete error:', err);
      }
      fileUrl = null;
    }

    const updated = await prisma.announcement.update({
      where: { id: parseInt(id) },
      data: {
        title,
        serial: serial ? parseInt(serial as string) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' || isActive === true : undefined,
        fileUrl,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: updated,
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'updateAnnouncement', error };
    throw new AppError(errorObj);
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.announcement.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (existing.fileUrl) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = existing.fileUrl.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const fileName = fileNameWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileName}`;

        // Determine resource type (image or raw for PDFs)
        const resourceType = existing.fileUrl.toLowerCase().includes('.pdf') ? 'raw' : 'image';
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      } catch (err) {
        console.error('Cloudinary delete error:', err);
      }
    }

    await prisma.announcement.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'deleteAnnouncement', error };
    throw new AppError(errorObj);
  }
};
