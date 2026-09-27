import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITripPlace {
  name: string;
  description?: string;
  points: number;
  isSelected: boolean; // true = pending/active task, false = completed task
}

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  destination: string;
  startDate: Date | string;
  endDate: Date | string;
  places: ITripPlace[];
  totalPoints: number;
  status: 'current' | 'past';
  createdAt: Date | string;
}

const PlaceSchema = new Schema<ITripPlace>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  points: {
    type: Number,
    default: 2,
  },
  isSelected: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const TripSchema = new Schema<ITrip>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  destination: {
    type: String,
    required: [true, 'Please provide a destination'],
    trim: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date'],
  },
  places: {
    type: [PlaceSchema],
    default: [],
  },
  totalPoints: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['current', 'past'],
    default: 'current',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Trip: Model<ITrip> = mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);
export default Trip;