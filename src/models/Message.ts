import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  senderId: string;
  receiverId: string;
  content: string;
  senderName: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: {
    type: String,
    required: true,
    index: true,
  },
  receiverId: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  senderName: {
    type: String,
    default: 'Traveler',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for fast conversation retrieval
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
