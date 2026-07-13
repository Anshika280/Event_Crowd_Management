import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    capacityLimit: {
      type: Number,
      required: true,
    },
    currentCount: {
      type: Number,
      default: 0, // Number of currently checked-in users at the venue
    },
    category: {
      type: String,
      default: 'General',
    },
    price: {
      type: Number,
      default: 0,
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
