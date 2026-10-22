import { prisma } from '../config/db';

export interface AuditLogEntry {
  actorId: string;
  action: string;
  type?: 'AUDIT' | 'SECURITY' | 'ADMIN';
  targetId?: string;
  projectId?: string;
  details?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Persists an immutable administrative audit log into PostgreSQL activity logs.
   * Strictly avoids logging sensitive tokens, passwords, or confidential invention content.
   */
  static async logAdminAction(entry: AuditLogEntry): Promise<void> {
    try {
      if (!entry.actorId) {
        console.warn('AuditService: Missing actorId for admin action', entry.action);
        return;
      }

      // Sanitize metadata to guarantee no credentials or secrets get logged
      const safeMetadata: Record<string, any> = {
        targetId: entry.targetId,
        details: entry.details,
        timestamp: new Date().toISOString(),
        ...(entry.metadata || {}),
      };

      // Strip any potential sensitive keys
      delete safeMetadata.password;
      delete safeMetadata.token;
      delete safeMetadata.secret;
      delete safeMetadata.apiKey;
      delete safeMetadata.claimsBody;
      delete safeMetadata.specificationDraft;

      await prisma.activityLog.create({
        data: {
          userId: entry.actorId,
          projectId: entry.projectId || null,
          action: entry.action,
          type: entry.type || 'AUDIT',
          metadata: safeMetadata,
        },
      });
    } catch (error) {
      console.error('AuditService: Error recording admin audit log:', error);
    }
  }
}
