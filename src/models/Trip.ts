import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  destination: {
    type: String,
    required: [true, 'Please provide a destination'],
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date'],
  },
  places: [{
    name: String,
    description: String,
    points: Number,
    isSelected: {
      type: Boolean,
      default: false,
    },
  }],
  totalPoints: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema); 