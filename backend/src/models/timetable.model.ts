import mongoose, { Schema, Document } from 'mongoose';

export interface ITimetable extends Document {
  semesterOffering: mongoose.Types.ObjectId;
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "10:30"
  room: string;
  createdAt: Date;
  updatedAt: Date;
}

const timetableSchema = new Schema<ITimetable>(
  {
    semesterOffering: {
      type: Schema.Types.ObjectId,
      ref: 'SemesterOffering',
      required: [true, 'Timetable slot must reference a semester class offering'],
    },
    dayOfWeek: {
      type: Number,
      required: [true, 'Please specify the day of the week (1-7)'],
      min: 1,
      max: 7,
    },
    startTime: {
      type: String,
      required: [true, 'Please specify the class slot start time'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'Please specify the class slot end time'],
      trim: true,
    },
    room: {
      type: String,
      required: [true, 'Please specify the room number or location'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index slots by offering and day
timetableSchema.index({ semesterOffering: 1, dayOfWeek: 1 });

const Timetable = mongoose.model<ITimetable>('Timetable', timetableSchema);
export default Timetable;
