import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getEvents)
  .post(protect, admin, createEvent);

router.route('/:id')
  .get(getEventById)
  .put(protect, admin, updateEvent)
  .delete(protect, admin, deleteEvent);

export default router;
