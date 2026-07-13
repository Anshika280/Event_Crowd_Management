import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Helper to generate a clean, short, unique ticket code (e.g. EC-TEC-K9A7)
const generateUniqueTicketCode = async (event, RegistrationModel) => {
  // 1. Get Event Shorthand (e.g., 'Tech Summit' -> 'TEC')
  const cleanTitle = (event.title || 'EVT')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // keep only alphanumeric
  const eventCode = (cleanTitle.substring(0, 3) || 'EVT').padEnd(3, 'X');

  // 2. Cryptographically secure random alphabet generator (excluding ambiguous chars: O, 0, I, 1, L)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const getSecureRandomString = (length) => {
    let result = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += alphabet[bytes[i] % alphabet.length];
    }
    return result;
  };

  let ticketCode;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const randomPart = getSecureRandomString(4);
    ticketCode = `EC-${eventCode}-${randomPart}`;

    // Check if it's unique in the DB
    const existing = await RegistrationModel.findOne({ ticketCode });
    if (!existing) {
      isUnique = true;
    }
  }

  // Fallback in case of absolute failure to find unique (extremely unlikely)
  if (!isUnique) {
    ticketCode = `EC-${eventCode}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }

  return ticketCode;
};

// @desc    Register logged in user for an event
// @route   POST /api/registrations/register/:eventId
// @access  Private
export const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      user: req.user._id,
      event: eventId,
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // Check capacity limit
    const regCount = await Registration.countDocuments({ event: eventId });
    if (regCount >= event.capacityLimit) {
      return res.status(400).json({ message: 'Registration closed. Event capacity limit reached!' });
    }

    // Generate unique, short, real-world ticket code: EC-[EVENT_CODE]-[RANDOM_CODE]
    const ticketCode = await generateUniqueTicketCode(event, Registration);

    const registration = await Registration.create({
      user: req.user._id,
      event: eventId,
      ticketCode,
    });

    res.status(201).json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's registrations
// @route   GET /api/registrations/my-registrations
// @access  Private
export const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate('event')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all registrations for a specific event
// @route   GET /api/registrations/event/:eventId
// @access  Private/Admin
export const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.createdBy && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You did not create this event.' });
    }

    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Scan a QR ticket and lookup/check-in/check-out attendee
// @route   POST /api/registrations/scan
// @access  Private/Admin
export const scanTicket = async (req, res) => {
  try {
    const { ticketCode, action = 'lookup' } = req.body;

    if (!ticketCode) {
      return res.status(400).json({ status: 'error', message: 'No ticket code provided' });
    }

    // Find registration and populate user and event
    const registration = await Registration.findOne({ ticketCode })
      .populate('user', 'name email')
      .populate('event');

    if (!registration) {
      return res.status(404).json({ status: 'invalid', message: 'Ticket does not exist' });
    }

    const event = registration.event;

    // Check ownership of the event
    if (event.createdBy && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Access denied: This ticket is for an event created by another Admin.' });
    }

    const attendeeName = registration.attendeeName || registration.user?.name || 'Attendee';

    if (action === 'lookup') {
      return res.json({
        status: 'valid',
        message: registration.checkedIn ? 'Attendee is currently Checked In.' : 'Attendee is currently Checked Out.',
        checkedIn: registration.checkedIn,
        checkInTime: registration.checkInTime,
        attendee: attendeeName,
        eventTitle: event.title,
        currentCount: event.currentCount,
        capacityLimit: event.capacityLimit,
      });
    }

    if (action === 'checkin') {
      if (registration.checkedIn) {
        return res.status(400).json({
          status: 'already_scanned',
          message: 'Attendee is already checked in!',
          attendee: attendeeName,
          checkInTime: registration.checkInTime,
          eventTitle: event.title,
        });
      }

      // Check capacity limit
      if (event.currentCount >= event.capacityLimit) {
        return res.status(400).json({
          status: 'capacity_reached',
          message: 'Capacity full! Entry restricted.',
          eventTitle: event.title,
          capacityLimit: event.capacityLimit,
          currentCount: event.currentCount,
        });
      }

      // Perform check-in
      registration.checkedIn = true;
      registration.checkInTime = new Date();
      await registration.save();

      // Increment event checked-in count
      event.currentCount = (event.currentCount || 0) + 1;
      await event.save();

      return res.json({
        status: 'success',
        message: 'Access Allowed! Welcome to the event.',
        checkedIn: true,
        attendee: attendeeName,
        eventTitle: event.title,
        currentCount: event.currentCount,
        capacityLimit: event.capacityLimit,
      });
    }

    if (action === 'checkout') {
      if (!registration.checkedIn) {
        return res.status(400).json({
          status: 'error',
          message: 'Attendee is not checked in yet!',
          attendee: attendeeName,
          eventTitle: event.title,
        });
      }

      // Perform check-out
      registration.checkedIn = false;
      await registration.save();

      // Decrement event checked-in count
      event.currentCount = Math.max(0, (event.currentCount || 0) - 1);
      await event.save();

      return res.json({
        status: 'success',
        message: 'Check-out successful. Goodbye!',
        checkedIn: false,
        attendee: attendeeName,
        eventTitle: event.title,
        currentCount: event.currentCount,
        capacityLimit: event.capacityLimit,
      });
    }

    return res.status(400).json({ status: 'error', message: 'Invalid scan action specified.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Create Razorpay Order
// @route   POST /api/registrations/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const { eventId, numberOfTickets } = req.body;

    if (!eventId || !numberOfTickets || numberOfTickets < 1) {
      return res.status(400).json({ message: 'Invalid event or number of tickets' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check capacity limit
    const regCount = await Registration.countDocuments({ event: eventId });
    if (regCount + numberOfTickets > event.capacityLimit) {
      return res.status(400).json({ message: `Not enough capacity! Only ${event.capacityLimit - regCount} tickets left.` });
    }

    const price = event.price || 0;
    const totalAmount = price * numberOfTickets;

    if (totalAmount === 0) {
      return res.json({
        isFree: true,
        amount: 0,
        currency: 'INR',
        eventId,
      });
    }

    // Initialize Razorpay
    const rzpKeyId = process.env.RAZORPAY_KEY_ID;
    const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!rzpKeyId || !rzpKeySecret) {
      return res.status(500).json({ message: 'Razorpay keys are not configured on the server.' });
    }

    const rzpInstance = new Razorpay({
      key_id: rzpKeyId,
      key_secret: rzpKeySecret,
    });

    const options = {
      amount: totalAmount * 100, // amount in paisa
      currency: 'INR',
      receipt: `receipt_ev_${eventId.substring(eventId.length - 6)}_${Date.now()}`,
    };

    const order = await rzpInstance.orders.create(options);

    res.json({
      isFree: false,
      isMock: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: rzpKeyId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Razorpay Payment and finalize booking
// @route   POST /api/registrations/verify-payment
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId, attendees } = req.body;

    if (!eventId || !attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ message: 'Missing event ID or attendee details' });
    }

    // 1. Signature verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const rzpKeyId = process.env.RAZORPAY_KEY_ID;
    
    if (!rzpKeyId || !secret) {
      return res.status(500).json({ message: 'Razorpay keys are not configured on the server.' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isVerified = expectedSignature === razorpay_signature;

    if (!isVerified) {
      return res.status(400).json({ message: 'Payment signature verification failed!' });
    }

    // 2. Capacity limit check
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const regCount = await Registration.countDocuments({ event: eventId });
    if (regCount + attendees.length > event.capacityLimit) {
      return res.status(400).json({ message: 'Capacity limit reached during checkout! A refund will be initiated.' });
    }

    // 3. Create individual registrations
    const registrations = [];
    for (const attendee of attendees) {
      const ticketCode = await generateUniqueTicketCode(event, Registration);

      const reg = await Registration.create({
        user: req.user._id,
        event: eventId,
        ticketCode,
        attendeeName: attendee.name,
        attendeeEmail: attendee.email,
        attendeePhone: attendee.phone,
        paymentId: razorpay_payment_id || 'mock_payment_id',
        orderId: razorpay_order_id || 'mock_order_id',
        status: 'confirmed'
      });
      registrations.push(reg);
    }

    res.status(201).json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register for free event
// @route   POST /api/registrations/register-free
// @access  Private
export const registerFree = async (req, res) => {
  try {
    const { eventId, attendees } = req.body;

    if (!eventId || !attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ message: 'Missing event ID or attendee details' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Capacity limit check
    const regCount = await Registration.countDocuments({ event: eventId });
    if (regCount + attendees.length > event.capacityLimit) {
      return res.status(400).json({ message: 'Event capacity full!' });
    }

    // Create individual registrations
    const registrations = [];
    for (const attendee of attendees) {
      const ticketCode = await generateUniqueTicketCode(event, Registration);

      const reg = await Registration.create({
        user: req.user._id,
        event: eventId,
        ticketCode,
        attendeeName: attendee.name,
        attendeeEmail: attendee.email,
        attendeePhone: attendee.phone,
        paymentId: 'FREE',
        orderId: 'FREE',
        status: 'confirmed'
      });
      registrations.push(reg);
    }

    res.status(201).json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
