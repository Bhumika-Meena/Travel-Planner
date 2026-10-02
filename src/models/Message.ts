import { ObjectId } from 'mongodb';

export interface IMessage {
  _id?: ObjectId;
  senderId: string;
  receiverId: string;
  content: string;
  senderName?: string;
  timestamp?: string;
  createdAt: Date;
  isRead?: boolean;
}

export type MessageDocument = IMessage & { _id: ObjectId };
export default IMessage;
