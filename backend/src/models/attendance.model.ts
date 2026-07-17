import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  student: mongoose.Types.ObjectId;
  semesterOffering: mongoose.Types.ObjectId;
  date: Date;
  status: 'Present' | 'Absent' | 'Leave' | 'Late';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Attendance record must be linked to a student'],
    },
    semesterOffering: {
      type: Schema.Types.ObjectId,
      ref: 'SemesterOffering',
      required: [true, 'Attendance record must reference a subject class offering'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide the attendance date'],
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Leave', 'Late'],
      required: [true, 'Please specify the attendance status'],
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a student only gets marked once per offering per day
attendanceSchema.index({ student: 1, semesterOffering: 1, date: 1 }, { unique: true });

// Optimize query patterns for frequent lookups
attendanceSchema.index({ student: 1, semesterOffering: 1 });

const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
export default Attendance;
