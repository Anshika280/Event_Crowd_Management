import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkInTime: {
      type: Date,
    },
    attendeeName: {
      type: String,
    },
    attendeeEmail: {
      type: String,
    },
    attendeePhone: {
      type: String,
    },
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
);

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
