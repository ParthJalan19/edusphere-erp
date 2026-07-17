import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string; // e.g. "Computer Science & Engineering"
  code: string; // e.g. "CSE"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Please provide the department name'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide the department code'],
      unique: true,
      uppercase: true,
      trim: true,
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

const Department = mongoose.model<IDepartment>('Department', departmentSchema);
export default Department;
