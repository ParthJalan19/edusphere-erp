import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  email: string;
  employeeId: string;
  phone?: string;
  department?: mongoose.Types.ObjectId; // Will reference Department collection in Milestone 3
  designation?: string;
  joiningDate?: Date;
  isActive: boolean;
}

const teacherSchema = new Schema<ITeacher>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher profile must belong to a User account'],
    },
    name: {
      type: String,
      required: [true, 'Please provide the teacher name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide the teacher email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Please provide the Employee ID'],
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    designation: {
      type: String,
      default: 'Assistant Professor',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Teacher = mongoose.model<ITeacher>('Teacher', teacherSchema);
export default Teacher;
