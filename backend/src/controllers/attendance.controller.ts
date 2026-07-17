import { Request, Response, NextFunction } from 'express';
import Attendance from '../models/attendance.model.js';
import SemesterOffering from '../models/semesterOffering.model.js';
import { AppError } from '../utils/appError.js';

export const markAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semesterOfferingId, date, records } = req.body;

    if (!semesterOfferingId || !date || !records || !Array.isArray(records)) {
      throw new AppError('Please provide offering ID, date, and attendance records list.', 400);
    }

    // Convert date string to start of day UTC
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Verify offering exists
    const offering = await SemesterOffering.findById(semesterOfferingId);
    if (!offering) {
      throw new AppError('Semester offering class not found', 404);
    }

    // Prepare bulk write operations to insert or update existing records
    const bulkOps = records.map((rec: any) => {
      if (!rec.studentId || !rec.status) {
        throw new AppError('Each attendance record must have studentId and status.', 400);
      }
      return {
        updateOne: {
          filter: {
            student: rec.studentId,
            semesterOffering: semesterOfferingId,
            date: attendanceDate,
          },
          update: {
            $set: {
              status: rec.status,
              remarks: rec.remarks || '',
            },
          },
          upsert: true,
        },
      };
    });

    await Attendance.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      data: {
        message: `Attendance marked successfully for ${records.length} students on ${attendanceDate.toDateString()}`,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { semesterOfferingId } = req.query;

    const query: any = { student: studentId };
    if (semesterOfferingId) {
      query.semesterOffering = semesterOfferingId;
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'semesterOffering',
        populate: [{ path: 'subject' }, { path: 'semester' }],
      })
      .sort({ date: -1 });

    // Calculate statistics
    const totalCount = records.length;
    const presentCount = records.filter(
      (r) => r.status === 'Present' || r.status === 'Late'
    ).length;
    const percentage =
      totalCount > 0 ? parseFloat(((presentCount / totalCount) * 100).toFixed(2)) : 100.0;

    res.status(200).json({
      success: true,
      data: {
        percentage,
        total: totalCount,
        present: presentCount,
        absent: records.filter((r) => r.status === 'Absent').length,
        leave: records.filter((r) => r.status === 'Leave').length,
        late: records.filter((r) => r.status === 'Late').length,
        records,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getOfferingAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { offeringId } = req.params;
    const { date } = req.query;

    const query: any = { semesterOffering: offeringId };
    if (date) {
      const queryDate = new Date(date as string);
      queryDate.setUTCHours(0, 0, 0, 0);
      query.date = queryDate;
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'student',
        select: 'name email rollNumber',
      })
      .sort({ date: -1, 'student.name': 1 });

    res.status(200).json({
      success: true,
      data: records,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
