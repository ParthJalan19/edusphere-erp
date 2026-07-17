import { Request, Response, NextFunction } from 'express';
import Result from '../models/result.model.js';
import SemesterOffering from '../models/semesterOffering.model.js';
import { AppError } from '../utils/appError.js';

// Grade points helper
const calculateGrade = (total: number) => {
  if (total >= 90) return { gp: 10, gl: 'O' as const };
  if (total >= 80) return { gp: 9, gl: 'A+' as const };
  if (total >= 70) return { gp: 8, gl: 'A' as const };
  if (total >= 60) return { gp: 7, gl: 'B+' as const };
  if (total >= 50) return { gp: 6, gl: 'B' as const };
  if (total >= 45) return { gp: 5, gl: 'C' as const };
  if (total >= 40) return { gp: 4, gl: 'P' as const };
  return { gp: 0, gl: 'F' as const };
};

export const enterResultBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semesterOfferingId, records } = req.body;

    if (!semesterOfferingId || !records || !Array.isArray(records)) {
      throw new AppError('Please provide offering ID and student grades list.', 400);
    }

    const offering = await SemesterOffering.findById(semesterOfferingId);
    if (!offering) {
      throw new AppError('Semester offering class not found', 404);
    }

    const bulkOps = records.map((rec: any) => {
      const internal = Number(rec.internalMarks);
      const external = Number(rec.externalMarks);

      if (isNaN(internal) || internal < 0 || internal > 40) {
        throw new AppError('Internal marks must be a number between 0 and 40.', 400);
      }
      if (isNaN(external) || external < 0 || external > 60) {
        throw new AppError('External marks must be a number between 0 and 60.', 400);
      }

      const total = internal + external;
      const { gp, gl } = calculateGrade(total);

      return {
        updateOne: {
          filter: {
            student: rec.studentId,
            semesterOffering: semesterOfferingId,
          },
          update: {
            $set: {
              internalMarks: internal,
              externalMarks: external,
              totalMarks: total,
              gradePoint: gp,
              gradeLetter: gl,
            },
          },
          upsert: true,
        },
      };
    });

    await Result.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      data: {
        message: `Marks successfully entered/updated for ${records.length} students.`,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const publishResults = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semesterOfferingId } = req.body;

    if (!semesterOfferingId) {
      throw new AppError('Please specify the semesterOfferingId to publish.', 400);
    }

    const updated = await Result.updateMany(
      { semesterOffering: semesterOfferingId },
      { $set: { isPublished: true } }
    );

    res.status(200).json({
      success: true,
      data: {
        message: `Results successfully published for class offering. Affected records: ${updated.modifiedCount}`,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentGrades = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId } = req.params;

    // Retrieve published results populated with offerings, subjects and semesters
    const results = await Result.find({ student: studentId, isPublished: true }).populate({
      path: 'semesterOffering',
      populate: [{ path: 'subject' }, { path: 'semester' }, { path: 'class' }],
    });

    // Group results by semester to compute dynamic SGPA
    const semesterGroups: Record<
      string,
      { semesterName: string; results: any[]; totalCredits: number; creditPointsSum: number }
    > = {};

    results.forEach((r: any) => {
      const offering = r.semesterOffering;
      if (!offering) return;

      const semester = offering.semester;
      const subject = offering.subject;
      if (!semester || !subject) return;

      const semIdStr = semester._id.toString();

      if (!semesterGroups[semIdStr]) {
        semesterGroups[semIdStr] = {
          semesterName: semester.name,
          results: [],
          totalCredits: 0,
          creditPointsSum: 0,
        };
      }

      const credits = subject.credits || 3;
      const gp = r.gradePoint;

      semesterGroups[semIdStr].results.push({
        _id: r._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        credits,
        internalMarks: r.internalMarks,
        externalMarks: r.externalMarks,
        totalMarks: r.totalMarks,
        gradeLetter: r.gradeLetter,
        gradePoint: gp,
      });

      semesterGroups[semIdStr].totalCredits += credits;
      semesterGroups[semIdStr].creditPointsSum += gp * credits;
    });

    const semesterMarksheets = Object.keys(semesterGroups).map((semId) => {
      const group = semesterGroups[semId];
      const sgpa =
        group.totalCredits > 0
          ? parseFloat((group.creditPointsSum / group.totalCredits).toFixed(2))
          : 0.0;
      return {
        semesterId: semId,
        semesterName: group.semesterName,
        results: group.results,
        totalCredits: group.totalCredits,
        sgpa,
      };
    });

    res.status(200).json({
      success: true,
      data: semesterMarksheets,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Teacher query for offering marks grid
export const getOfferingGrades = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { offeringId } = req.params;

    const grades = await Result.find({ semesterOffering: offeringId })
      .populate({ path: 'student', select: 'name email rollNumber' })
      .sort({ 'student.name': 1 });

    res.status(200).json({
      success: true,
      data: grades,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
