import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  semesterOffering: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  totalMarks: number;
  fileAttachmentUrl?: string;
  fileAttachmentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    semesterOffering: {
      type: Schema.Types.ObjectId,
      ref: 'SemesterOffering',
      required: [true, 'Assignment must belong to a Semester Offering'],
    },
    title: {
      type: String,
      required: [true, 'Please provide an assignment title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide an assignment description'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide a submission deadline'],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Please specify the maximum marks obtainable'],
    },
    fileAttachmentUrl: {
      type: String,
    },
    fileAttachmentName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);
export default Assignment;
