import mongoose, { Schema, Document } from 'mongoose';

export interface IResult extends Document {
  student: mongoose.Types.ObjectId;
  semesterOffering: mongoose.Types.ObjectId;
  internalMarks: number; // Max 40
  externalMarks: number; // Max 60
  totalMarks: number; // Max 100
  gradePoint: number; // 0 to 10
  gradeLetter: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F';
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const resultSchema = new Schema<IResult>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Result must be linked to a student'],
    },
    semesterOffering: {
      type: Schema.Types.ObjectId,
      ref: 'SemesterOffering',
      required: [true, 'Result must refer to a subject class offering'],
    },
    internalMarks: {
      type: Number,
      required: [true, 'Please provide internal assessment marks (max 40)'],
      min: [0, 'Internal marks cannot be negative'],
      max: [40, 'Internal marks cannot exceed 40'],
    },
    externalMarks: {
      type: Number,
      required: [true, 'Please provide external university examination marks (max 60)'],
      min: [0, 'External marks cannot be negative'],
      max: [60, 'External university exam marks cannot exceed 60'],
    },
    totalMarks: {
      type: Number,
    },
    gradePoint: {
      type: Number,
    },
    gradeLetter: {
      type: String,
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a student only has one result record per subject offering
resultSchema.index({ student: 1, semesterOffering: 1 }, { unique: true });

// Pre-save hook to calculate total marks, grade point, and grade letter
resultSchema.pre('save', function (next) {
  this.totalMarks = this.internalMarks + this.externalMarks;

  const score = this.totalMarks;

  if (score >= 90) {
    this.gradePoint = 10;
    this.gradeLetter = 'O';
  } else if (score >= 80) {
    this.gradePoint = 9;
    this.gradeLetter = 'A+';
  } else if (score >= 70) {
    this.gradePoint = 8;
    this.gradeLetter = 'A';
  } else if (score >= 60) {
    this.gradePoint = 7;
    this.gradeLetter = 'B+';
  } else if (score >= 50) {
    this.gradePoint = 6;
    this.gradeLetter = 'B';
  } else if (score >= 45) {
    this.gradePoint = 5;
    this.gradeLetter = 'C';
  } else if (score >= 40) {
    this.gradePoint = 4;
    this.gradeLetter = 'P';
  } else {
    this.gradePoint = 0;
    this.gradeLetter = 'F';
  }

  next();
});

const Result = mongoose.model<IResult>('Result', resultSchema);
export default Result;
