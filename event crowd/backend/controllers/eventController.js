import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

// Helper to parse start time from time slot string (e.g. "09:00 AM - 05:00 PM")
const parseStartTimeSlot = (timeSlotStr) => {
  if (!timeSlotStr || !timeSlotStr.includes('-')) {
    return null;
  }
  const parts = timeSlotStr.split('-');
  const startTimeStr = parts[0].trim();
  
  const match = startTimeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  
  let [_, hoursStr, minutes, ampm] = match;
  let hours = parseInt(hoursStr, 10);
  ampm = ampm.toUpperCase();
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return { hours, minutes: parseInt(minutes, 10) };
};

// Helper to safely parse Date object or YYYY-MM-DD string to server local midnight Date
const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  let dateObj;
  if (dateStr instanceof Date) {
    dateObj = dateStr;
  } else {
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    dateObj = new Date(dateStr);
  }
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
};

// Returns error message if date/time is in the past, or null if valid
const validateEventDateTime = (dateStr, timeSlotStr) => {
  if (!dateStr) return null;
  
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const targetMidnight = parseDateString(dateStr);
  if (!targetMidnight) return null;
  
  if (targetMidnight < todayMidnight) {
    return 'Event date must be in the future.';
  }
  
  if (targetMidnight.getTime() === todayMidnight.getTime()) {
    const startTime = parseStartTimeSlot(timeSlotStr);
    if (startTime) {
      const eventTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startTime.hours, startTime.minutes, 0, 0);
      if (eventTime <= now) {
        return 'Event start time must be in the future.';
      }
    }
  }
  return null;
};

// @desc    Get all events (with optional search and category filters)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const events = await Event.find(query).sort({ date: 1 });
    
    const eventsWithRegCount = await Promise.all(
      events.map(async (event) => {
        const registrationsCount = await Registration.countDocuments({ event: event._id });
        return {
          ...event.toObject(),
          registrationsCount,
        };
      })
    );
    
    res.json(eventsWithRegCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, capacityLimit, category, bannerUrl, price } = req.body;

    if (!title || !description || !date || !time || !venue || !capacityLimit) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const validationError = validateEventDateTime(date, time);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const event = await Event.create({
      title,
      description,
      date,
      time,
      venue,
      capacityLimit: Number(capacityLimit),
      category: category || 'General',
      bannerUrl: bannerUrl || '',
      price: price !== undefined ? Number(price) : 0,
      createdBy: req.user._id,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
export const updateEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, capacityLimit, category, bannerUrl, price } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to update this event.' });
    }

    const validationError = validateEventDateTime(date || event.date, time || event.time);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.time = time || event.time;
    event.venue = venue || event.venue;
    event.capacityLimit = capacityLimit !== undefined ? Number(capacityLimit) : event.capacityLimit;
    event.category = category || event.category;
    event.bannerUrl = bannerUrl || event.bannerUrl;
    event.price = price !== undefined ? Number(price) : event.price;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to delete this event.' });
    }

    await event.deleteOne();
    res.json({ message: 'Event removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
