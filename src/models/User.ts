import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
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
  trips: mongoose.Types.ObjectId[];
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  fullName: {
    type: String,
    required: [true, 'Please provide a full name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  points: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  badges: {
    type: [String],
    default: [],
  },
  totalTrips: {
    type: Number,
    default: 0,
  },
  isTripPublic: {
    type: Boolean,
    default: false,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500,
  },
  trips: [{
    type: Schema.Types.ObjectId,
    ref: 'Trip',
  }],
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual alias 'name' -> 'fullName' for backwards compatibility
UserSchema.virtual('name').get(function () {
  return this.fullName;
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;