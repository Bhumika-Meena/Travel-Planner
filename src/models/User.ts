import { ObjectId } from 'mongodb';

export interface IUser {
  _id?: ObjectId;
  fullName: string;
  name?: string; // Backwards compatibility alias
  email: string;
  password?: string;
  isVerified: boolean;
  points: number;
  level: number;
  badges: string[];
  totalTrips: number;
  profilePicture?: string | null;
  bio?: string;
  isTripPublic?: boolean;
  trips?: ObjectId[];
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = IUser & { _id: ObjectId };
export default IUser;