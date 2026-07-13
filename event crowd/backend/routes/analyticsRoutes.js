import express from 'express';
import { getLiveStatus, getAttendanceReport } from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/live-status', protect, admin, getLiveStatus);
router.get('/attendance-report', protect, admin, getAttendanceReport);

export default router;
