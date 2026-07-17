import { Request, Response, NextFunction } from 'express';
import SemesterOffering from '../models/semesterOffering.model.js';
import Semester from '../models/semester.model.js';
import Department from '../models/department.model.js';
import Course from '../models/course.model.js';
import Subject from '../models/subject.model.js';
import Class from '../models/class.model.js';
import { AppError } from '../utils/appError.js';

export const getSemesterOfferings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teacherId, studentId, semesterId } = req.query;

    const query: Record<string, unknown> = {};
    if (semesterId) {
      query.semester = semesterId;
    }
    if (teacherId) {
      query.teacher = teacherId;
    }
    if (studentId) {
      query.students = studentId;
    }

    // Support simple pagination defaults
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const skip = (page - 1) * limit;

    const offerings = await SemesterOffering.find(query)
      .populate('semester')
      .populate('subject')
      .populate('class')
      .populate({
        path: 'teacher',
        select: 'name email employeeId designation',
      })
      .skip(skip)
      .limit(limit);

    const total = await SemesterOffering.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        offerings,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getSemesterOfferingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const offering = await SemesterOffering.findById(req.params.id)
      .populate('semester')
      .populate('subject')
      .populate('class')
      .populate({
        path: 'teacher',
        select: 'name email employeeId designation',
      })
      .populate({
        path: 'students',
        select: 'name email rollNumber phone',
      });

    if (!offering) {
      throw new AppError('Semester offering not found', 404);
    }

    res.status(200).json({
      success: true,
      data: offering,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getSemesters = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const semesters = await Semester.find().populate('academicYear');
    res.status(200).json({
      success: true,
      data: semesters,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departments = await Department.find();
    res.status(200).json({
      success: true,
      data: departments,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourses = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courses = await Course.find().populate('department');
    res.status(200).json({
      success: true,
      data: courses,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubjects = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subjects = await Subject.find().populate('course').populate('department');
    res.status(200).json({
      success: true,
      data: subjects,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getClasses = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const classes = await Class.find().populate('course');
    res.status(200).json({
      success: true,
      data: classes,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
