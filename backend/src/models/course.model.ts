import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  name: string; // e.g. "B.Tech Computer Science & Engineering"
  code: string; // e.g. "BTECH-CSE"
  department: mongoose.Types.ObjectId;
  durationYears: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: [true, 'Please provide the course name'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide the course code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Course must belong to a department'],
    },
    durationYears: {
      type: Number,
      default: 4,
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model<ICourse>('Course', courseSchema);
export default Course;
