import { prisma } from '../config/db';
import { ActivityLog } from '@prisma/client';

export class ActivityService {
  /**
   * Creates a structured, persistent project activity audit log entry.
   */
  static async createActivity(
    projectId: string,
    actorId: string,
    action: string,
    type: string = 'GENERAL',
    metadata?: Record<string, any>
  ): Promise<ActivityLog | null> {
    try {
      if (!projectId || !actorId || !action) return null;

      // Sanitize metadata to exclude sensitive credentials or tokens
      let safeMetadata: Record<string, any> | undefined = undefined;
      if (metadata && typeof metadata === 'object') {
        safeMetadata = {};
        const forbiddenKeys = ['password', 'jwt', 'token', 'apikey', 'secret', 'auth', 'bearer'];
        for (const [key, value] of Object.entries(metadata)) {
          if (!forbiddenKeys.some((fk) => key.toLowerCase().includes(fk))) {
            safeMetadata[key] = value;
          }
        }
      }

      return await prisma.activityLog.create({
        data: {
          projectId,
          userId: actorId,
          action: action.trim(),
          type: (type || 'GENERAL').toUpperCase(),
          metadata: safeMetadata ?? undefined
        }
      });
    } catch (error) {
      // Activity logging failure must never corrupt or interrupt core business operations
      console.error('Activity logging failed silently:', error);
      return null;
    }
  }

  /**
   * Retrieves paginated project activity audit logs with optional category filter.
   */
  static async listProjectActivities(
    projectId: string,
    filterType?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<ActivityLog[]> {
    const whereClause: any = { projectId };
    if (filterType && filterType.toUpperCase() !== 'ALL') {
      whereClause.type = filterType.toUpperCase();
    }

    return prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      skip: Math.max(skip, 0)
    });
  }
}
