import { ObjectId } from 'mongodb';

export interface IOTP {
  _id?: ObjectId;
  email: string;
  otp: string;
  expiresAt: Date;
  failedAttempts?: number;
  createdAt?: Date;
}

export type OtpDocument = IOTP & { _id: ObjectId };
export default IOTP;