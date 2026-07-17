import mongoose, { Schema, Document } from 'mongoose';

export interface ISemesterOffering extends Document {
  semester: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const semesterOfferingSchema = new Schema<ISemesterOffering>(
  {
    semester: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Offering must be linked to a time-bound Semester'],
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Offering must define the Subject to teach'],
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Offering must be assigned to a specific Class section'],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Offering must have an assigned Teacher'],
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index on semester + subject + class to prevent duplicate class offerings in a semester
semesterOfferingSchema.index({ semester: 1, subject: 1, class: 1 }, { unique: true });

const SemesterOffering = mongoose.model<ISemesterOffering>(
  'SemesterOffering',
  semesterOfferingSchema
);
export default SemesterOffering;
