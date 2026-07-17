import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  name: string; // e.g. "CSE Section A"
  course: mongoose.Types.ObjectId;
  batchYear: number; // e.g. 2024
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    name: {
      type: String,
      required: [true, 'Please provide the class name/section'],
      trim: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Class section must belong to a Course'],
    },
    batchYear: {
      type: Number,
      required: [true, 'Please specify the batch year of admission'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on course + name + batchYear to prevent duplicates
classSchema.index({ course: 1, name: 1, batchYear: 1 }, { unique: true });

const Class = mongoose.model<IClass>('Class', classSchema);
export default Class;
