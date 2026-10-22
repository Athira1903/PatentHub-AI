import { Response } from 'express';
import { z } from 'zod';
import { CalendarService } from '../services/calendarService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const createEventSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters'),
  description: z.string().trim().optional().nullable(),
  eventType: z
    .enum([
      'PATENT_DEADLINE',
      'ROADMAP_MILESTONE',
      'PROJECT_TASK',
      'GUIDE_MEETING',
      'EXPERT_REVIEW',
      'TEAM_MEETING',
      'REMINDER',
      'CUSTOM',
    ])
    .optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  allDay: z.boolean().optional(),
  location: z.string().trim().optional().nullable(),
  meetingUrl: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  projectId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  reminderMinutes: z.number().int().positive().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
});

const updateEventSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional().nullable(),
  eventType: z
    .enum([
      'PATENT_DEADLINE',
      'ROADMAP_MILESTONE',
      'PROJECT_TASK',
      'GUIDE_MEETING',
      'EXPERT_REVIEW',
      'TEAM_MEETING',
      'REMINDER',
      'CUSTOM',
    ])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  allDay: z.boolean().optional(),
  location: z.string().trim().optional().nullable(),
  meetingUrl: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  projectId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  reminderMinutes: z.number().int().positive().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
});

export const getCalendarEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, projectId, category, status } = req.query as {
      startDate?: string;
      endDate?: string;
      projectId?: string;
      category?: string;
      status?: string;
    };

    const events = await CalendarService.getEvents(req.user, {
      startDate,
      endDate,
      projectId,
      category,
      status,
    });

    res.status(200).json({ success: true, count: events.length, events });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to retrieve calendar events' });
  }
};

export const getCalendarEventById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.eventId as string;
    const event = await CalendarService.getEventById(eventId, req.user);
    res.status(200).json({ success: true, event });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message || 'Calendar event not found' });
  }
};

export const createCalendarEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validated = createEventSchema.parse(req.body);
    const event = await CalendarService.createEvent(req.user, validated);
    res.status(201).json({ success: true, message: 'Event created successfully', event });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(400).json({ success: false, message: error.message || 'Failed to create event' });
  }
};

export const updateCalendarEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.eventId as string;
    const validated = updateEventSchema.parse(req.body);
    const event = await CalendarService.updateEvent(eventId, req.user, validated);
    res.status(200).json({ success: true, message: 'Event updated successfully', event });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(400).json({ success: false, message: error.message || 'Failed to update event' });
  }
};

export const deleteCalendarEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.eventId as string;
    const result = await CalendarService.deleteEvent(eventId, req.user);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete event' });
  }
};
