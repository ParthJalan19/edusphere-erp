import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string; // e.g. "Database Management Systems"
  code: string; // e.g. "CS401"
  credits: number; // e.g. 4
  course: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: [true, 'Please provide the subject name'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide the subject code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    credits: {
      type: Number,
      default: 3,
      required: [true, 'Subject must carry credit weight'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Subject must belong to a course syllabus'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Subject must be managed by a department'],
    },
  },
  {
    timestamps: true,
  }
);

const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
export default Subject;
