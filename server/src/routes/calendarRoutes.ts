import { Router } from 'express';
import {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../controllers/calendarController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getCalendarEvents as any);
router.get('/:eventId', getCalendarEventById as any);
router.post('/', createCalendarEvent as any);
router.put('/:eventId', updateCalendarEvent as any);
router.delete('/:eventId', deleteCalendarEvent as any);

export default router;
