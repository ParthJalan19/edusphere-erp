import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  email: string;
  rollNumber: string;
  phone?: string;
  department?: mongoose.Types.ObjectId; // References Department in Milestone 3
  course?: mongoose.Types.ObjectId; // References Course in Milestone 3
  admissionDate?: Date;
  isActive: boolean;
}

const studentSchema = new Schema<IStudent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student profile must belong to a User account'],
    },
    name: {
      type: String,
      required: [true, 'Please provide the student name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide the student email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Please provide the Roll Number'],
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
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    admissionDate: {
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

const Student = mongoose.model<IStudent>('Student', studentSchema);
export default Student;
