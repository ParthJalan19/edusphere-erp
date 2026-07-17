import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.interface.js';
import Subject from '../models/subject.model.js';
import Assignment from '../models/assignment.model.js';
import Note from '../models/notes.model.js';
import Teacher from '../models/teacher.model.js';
import Student from '../models/student.model.js';

export const globalSearch = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = req.query.q as string;
    const role = req.user?.role;

    if (!q || q.trim().length < 2) {
      res.status(200).json({
        success: true,
        data: {
          subjects: [],
          assignments: [],
          notes: [],
          teachers: [],
          students: [],
        },
        error: null,
      });
      return;
    }

    const regex = new RegExp(q, 'i');

    // Run searches in parallel
    const subjectsPromise = Subject.find({
      $or: [{ name: regex }, { code: regex }],
    }).limit(5);

    const assignmentsPromise = Assignment.find({ title: regex }).limit(5);

    const notesPromise = Note.find({ title: regex }).limit(5);

    const teachersPromise = Teacher.find({ name: regex })
      .select('name email employeeId designation')
      .limit(5);

    // Secure Student Query: Only return student matches to Teachers
    const studentsPromise =
      role === 'Teacher'
        ? Student.find({
            $or: [{ name: regex }, { rollNumber: regex }],
          })
            .select('name email rollNumber phone')
            .limit(5)
        : Promise.resolve([]);

    const [subjects, assignments, notes, teachers, students] = await Promise.all([
      subjectsPromise,
      assignmentsPromise,
      notesPromise,
      teachersPromise,
      studentsPromise,
    ]);

    res.status(200).json({
      success: true,
      data: {
        subjects,
        assignments,
        notes,
        teachers,
        students,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
