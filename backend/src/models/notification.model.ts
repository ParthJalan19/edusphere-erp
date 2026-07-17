import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // References Auth User
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must target a recipient user'],
    },
    title: {
      type: String,
      required: [true, 'Please specify the notification title'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Please specify the notification message body'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index recipient for quick active logs query
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
