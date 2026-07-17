import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.interface.js';
import Timetable from '../models/timetable.model.js';
import SemesterOffering from '../models/semesterOffering.model.js';
import Student from '../models/student.model.js';
import Teacher from '../models/teacher.model.js';
import { AppError } from '../utils/appError.js';

export const getTimetable = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const role = req.user?.role;

    if (!userId || !role) {
      throw new AppError('User profile details not found in session', 401);
    }

    let offeringIds: any[] = [];

    if (role === 'Teacher') {
      const teacher = await Teacher.findOne({ user: userId });
      if (!teacher) {
        throw new AppError('Teacher profile not found', 404);
      }
      const offerings = await SemesterOffering.find({ teacher: teacher._id });
      offeringIds = offerings.map((o) => o._id);
    } else if (role === 'Student') {
      const student = await Student.findOne({ user: userId });
      if (!student) {
        throw new AppError('Student profile not found', 404);
      }
      const offerings = await SemesterOffering.find({ students: student._id });
      offeringIds = offerings.map((o) => o._id);
    }

    // Retrieve timetable records matching those active offerings
    const slots = await Timetable.find({ semesterOffering: { $in: offeringIds } })
      .populate({
        path: 'semesterOffering',
        populate: [{ path: 'subject' }, { path: 'class' }, { path: 'teacher', select: 'name' }],
      })
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: slots,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
