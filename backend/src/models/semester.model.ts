import mongoose, { Schema, Document } from 'mongoose';

export interface ISemester extends Document {
  name: string; // e.g. "2026 Odd Semester"
  academicYear: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'upcoming';
  createdAt: Date;
  updatedAt: Date;
}

const semesterSchema = new Schema<ISemester>(
  {
    name: {
      type: String,
      required: [true, 'Please provide the semester name'],
      trim: true,
    },
    academicYear: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Semester must belong to an academic year'],
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide the start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide the end date'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'upcoming'],
      default: 'upcoming',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on academicYear + name to avoid duplicates inside the same year
semesterSchema.index({ academicYear: 1, name: 1 }, { unique: true });

const Semester = mongoose.model<ISemester>('Semester', semesterSchema);
export default Semester;
