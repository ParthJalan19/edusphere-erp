import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  semesterOffering: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  title: string;
  fileUrl: string;
  fileName: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    semesterOffering: {
      type: Schema.Types.ObjectId,
      ref: 'SemesterOffering',
      required: [true, 'Note must belong to a Semester Offering subject class'],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Note must have an uploading teacher reference'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the notes'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'Please specify the notes file storage link'],
    },
    fileName: {
      type: String,
      required: [true, 'Please specify the notes file name'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Note = mongoose.model<INote>('Note', noteSchema);
export default Note;
