import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import Note from '../models/notes.model.js';
import SemesterOffering from '../models/semesterOffering.model.js';
import { AppError } from '../utils/appError.js';

// Ensure local uploads directory exists
const localUploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

// 1. Configure Cloudinary if credentials are provided in .env
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary storage successfully initialized! ☁️');
} else {
  console.log('Cloudinary not configured. File system storage will act as local mock fallback. 📂');
}

// 2. Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, localUploadsDir);
  },
  filename: (_req, file, cb) => {
    // Sanitize file names and append timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`);
  },
});

// File type filter: PDF, DOCX, PPTX, ZIP, PNG, JPG, JPEG
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.docx', '.pptx', '.zip', '.png', '.jpg', '.jpeg'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const isExtensionAllowed = allowedExtensions.includes(ext);
  const isMimeAllowed = allowedMimeTypes.includes(file.mimetype);

  if (isExtensionAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only PDF, DOCX, PPTX, ZIP, PNG, JPG, JPEG are allowed.',
        400
      ) as any,
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
});

// 3. Controller to handle File Upload API
export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('No file was uploaded.', 400);
    }

    let fileUrl = '';
    const fileName = req.file.originalname;

    if (isCloudinaryConfigured) {
      // Upload to Cloudinary under authenticated folder structure
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'edusphere_erp/notes',
        type: 'authenticated', // private delivery
        resource_type: 'auto',
      });
      fileUrl = result.secure_url;

      // Delete local temporary file
      fs.unlinkSync(req.file.path);
    } else {
      // Fallback: Generate relative backend URL path pointing to local server downloader
      fileUrl = `/api/v1/files/download/${req.file.filename}`;
    }

    res.status(200).json({
      success: true,
      data: {
        fileUrl,
        fileName,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Controller to get notes list
export const getNotesByOffering = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { offeringId } = req.params;
    const notes = await Note.find({ semesterOffering: offeringId })
      .populate({ path: 'teacher', select: 'name email employeeId' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notes,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Controller to create notes entry
export const createNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semesterOfferingId, teacherId, title, fileUrl, fileName } = req.body;

    if (!semesterOfferingId || !teacherId || !title || !fileUrl || !fileName) {
      throw new AppError(
        'Please provide semesterOfferingId, teacherId, title, fileUrl, and fileName.',
        400
      );
    }

    const offering = await SemesterOffering.findById(semesterOfferingId);
    if (!offering) {
      throw new AppError('Semester offering class not found', 404);
    }

    const note = await Note.create({
      semesterOffering: semesterOfferingId,
      teacher: teacherId,
      title,
      fileUrl,
      fileName,
    });

    res.status(201).json({
      success: true,
      data: note,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Controller to serve file downloads (local fallback stream)
export const downloadFileLocal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { filename } = req.params;
    const filePath = path.join(localUploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on this server.', 404);
    }

    res.download(filePath, filename);
  } catch (error) {
    next(error);
  }
};

// 7. Controller to get signed Cloudinary URL for notes
export const getSignedUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rawUrl } = req.body;
    if (!rawUrl) {
      throw new AppError('Please provide a file url.', 400);
    }

    // If it's a local fallback URL, return it as-is (already matches downloadFileLocal routing)
    if (rawUrl.startsWith('/api/v1/files/download')) {
      res.status(200).json({
        success: true,
        data: {
          signedUrl: `${req.protocol}://${req.get('host')}${rawUrl}`,
        },
        error: null,
      });
      return;
    }

    if (isCloudinaryConfigured) {
      // Extract public_id from Cloudinary URL: e.g. res.cloudinary.com/.../authenticated/edusphere_erp/notes/abcd
      const matches = rawUrl.match(/\/authenticated\/(.+)$/);
      if (matches && matches[1]) {
        // Strip out optional extension from public id if present
        const publicIdWithExt = matches[1];
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

        const secureUrl = cloudinary.url(publicId, {
          type: 'authenticated',
          sign_url: true,
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        });

        res.status(200).json({
          success: true,
          data: {
            signedUrl: secureUrl,
          },
          error: null,
        });
        return;
      }
    }

    // Default: Fallback to returning rawUrl
    res.status(200).json({
      success: true,
      data: {
        signedUrl: rawUrl,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
