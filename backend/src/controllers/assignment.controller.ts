import { Request, Response, NextFunction } from 'express';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import SemesterOffering from '../models/semesterOffering.model.js';
import Student from '../models/student.model.js';
import { AppError } from '../utils/appError.js';
import mongoose from 'mongoose';

export const createAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      semesterOfferingId,
      title,
      description,
      dueDate,
      totalMarks,
      fileAttachmentUrl,
      fileAttachmentName,
    } = req.body;

    if (!semesterOfferingId || !title || !description || !dueDate || !totalMarks) {
      throw new AppError(
        'Please provide all required fields (offering ID, title, description, dueDate, totalMarks).',
        400
      );
    }

    const offering = await SemesterOffering.findById(semesterOfferingId);
    if (!offering) {
      throw new AppError('Semester offering class not found', 404);
    }

    const assignment = await Assignment.create({
      semesterOffering: semesterOfferingId,
      title,
      description,
      dueDate: new Date(dueDate),
      totalMarks: Number(totalMarks),
      fileAttachmentUrl,
      fileAttachmentName,
    });

    res.status(201).json({
      success: true,
      data: assignment,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignmentsByOffering = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { offeringId } = req.params;

    const assignments = await Assignment.find({ semesterOffering: offeringId }).sort({
      dueDate: 1,
    });

    res.status(200).json({
      success: true,
      data: assignments,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Returns all assignments in student's class, populated with submission status
export const getStudentAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId } = req.params;

    // Find offerings enrolled by this student
    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    const offerings = await SemesterOffering.find({ students: studentId });
    const offeringIds = offerings.map((o) => o._id);

    // Get all assignments for these offerings
    const assignments = await Assignment.find({ semesterOffering: { $in: offeringIds } })
      .populate({
        path: 'semesterOffering',
        populate: { path: 'subject' },
      })
      .sort({ dueDate: 1 });

    // Join with submission info
    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: studentId,
        });

        let submissionStatus = 'Pending';
        let latestVersion = null;

        if (submission && submission.versions.length > 0) {
          // Sort by version number to get latest
          const sortedVersions = [...submission.versions].sort(
            (a, b) => b.versionNumber - a.versionNumber
          );
          latestVersion = sortedVersions[0];
          submissionStatus = latestVersion.status;
        }

        return {
          _id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          totalMarks: assignment.totalMarks,
          fileAttachmentUrl: assignment.fileAttachmentUrl,
          fileAttachmentName: assignment.fileAttachmentName,
          semesterOffering: assignment.semesterOffering,
          submissionStatus,
          submission: submission,
          latestVersion,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: assignmentsWithSubmissions,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Get specific assignment submissions (Teacher audits)
export const getAssignmentSubmissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate({
        path: 'student',
        select: 'name email rollNumber',
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: submissions,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const submitAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { assignmentId, studentId, fileUrl, fileName } = req.body;

    if (!assignmentId || !studentId || !fileUrl || !fileName) {
      throw new AppError('Please provide assignment ID, student ID, file URL, and file name.', 400);
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    const isLate = new Date() > new Date(assignment.dueDate);
    const status = isLate ? 'Late' : 'Submitted';

    let submission = await Submission.findOne({ assignment: assignmentId, student: studentId });

    if (submission) {
      // Create new version
      const newVersionNum = submission.currentVersion + 1;
      submission.versions.push({
        versionNumber: newVersionNum,
        fileUrl,
        fileName,
        submittedAt: new Date(),
        status,
      });
      submission.currentVersion = newVersionNum;
      await submission.save();
    } else {
      // Create initial submission
      submission = await Submission.create({
        assignment: assignmentId,
        student: studentId,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            fileUrl,
            fileName,
            submittedAt: new Date(),
            status,
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      data: submission,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const gradeSubmission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { versionNumber, marksObtained, feedback, teacherId } = req.body;

    if (!versionNumber || marksObtained === undefined || !feedback || !teacherId) {
      throw new AppError(
        'Please specify versionNumber, marksObtained, feedback, and grading teacherId.',
        400
      );
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new AppError('Submission record not found', 404);
    }

    // Find and update the specific version
    const version = submission.versions.find((v) => v.versionNumber === Number(versionNumber));
    if (!version) {
      throw new AppError(`Submission version ${versionNumber} not found`, 404);
    }

    version.status = 'Graded';
    version.marksObtained = Number(marksObtained);
    version.feedback = feedback;
    version.gradedBy = new mongoose.Types.ObjectId(teacherId);

    // Save triggers validation and middleware
    await submission.save();

    res.status(200).json({
      success: true,
      data: submission,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
