import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmissionVersion {
  versionNumber: number;
  fileUrl: string;
  fileName: string;
  submittedAt: Date;
  status: 'Submitted' | 'Late' | 'Graded';
  marksObtained?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
}

export interface ISubmission extends Document {
  assignment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  versions: ISubmissionVersion[];
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const submissionVersionSchema = new Schema<ISubmissionVersion>({
  versionNumber: {
    type: Number,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Submitted', 'Late', 'Graded'],
    required: true,
  },
  marksObtained: {
    type: Number,
  },
  feedback: {
    type: String,
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
  },
});

const submissionSchema = new Schema<ISubmission>(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Submission must refer to a specific assignment'],
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Submission must belong to a student'],
    },
    versions: [submissionVersionSchema],
    currentVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure only one submission document exists per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

// Optimize query patterns
submissionSchema.index({ student: 1 });

const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
export default Submission;
