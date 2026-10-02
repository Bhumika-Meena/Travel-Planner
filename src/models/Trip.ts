import { ObjectId } from 'mongodb';

export interface ITripPlace {
  name: string;
  description?: string;
  points: number;
  isSelected: boolean; // true = pending/active task, false = completed task
  completedAt?: Date;
}

export interface ITrip {
  _id?: ObjectId;
  userId: ObjectId;
  destination: string;
  startDate: Date | string;
  endDate: Date | string;
  places: ITripPlace[];
  totalPoints: number;
  status: 'current' | 'past';
  createdAt: Date | string;
}

export type TripDocument = ITrip & { _id: ObjectId };
export default ITrip;