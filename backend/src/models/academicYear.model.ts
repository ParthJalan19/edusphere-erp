import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademicYear extends Document {
  name: string; // e.g. "2026-2027"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const academicYearSchema = new Schema<IAcademicYear>(
  {
    name: {
      type: String,
      required: [true, 'Please provide the academic year name'],
      unique: true,
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

const AcademicYear = mongoose.model<IAcademicYear>('AcademicYear', academicYearSchema);
export default AcademicYear;
