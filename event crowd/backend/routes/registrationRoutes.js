import express from 'express';
import {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  scanTicket,
  createRazorpayOrder,
  verifyRazorpayPayment,
  registerFree,
} from '../controllers/registrationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register/:eventId', protect, registerForEvent);
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyRazorpayPayment);
router.post('/register-free', protect, registerFree);
router.get('/my-registrations', protect, getMyRegistrations);
router.get('/event/:eventId', protect, admin, getEventRegistrations);
router.post('/scan', protect, admin, scanTicket);

export default router;
