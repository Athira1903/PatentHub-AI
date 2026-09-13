import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { prisma } from '../../config/db';

export interface ProjectRequest extends AuthenticatedRequest {
  project?: any;
}

/**
 * Project Guard middleware.
 * Automatically loads the Project (with members, owner, documents, tasks, comments)
 * using the ID in the route parameters, request body, or query, and evaluates the policy.
 * Attaches the pre-loaded project to `req.project` for downstream handlers.
 */
export const projectGuard = (
  policyFn: (user: any, project: any, req?: any) => boolean | Promise<boolean>
) => {
  return async (req: ProjectRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Access denied. Unauthorized.' });
        return;
      }

      const projectId = req.params.id || req.body.projectId || req.query.projectId;
      if (!projectId) {
        res.status(400).json({ message: 'Project ID is required.' });
        return;
      }

      const project = await prisma.patentProject.findUnique({
        where: { id: projectId },
        include: {
          members: {
            include: {
              user: { select: { id: true, fullName: true, username: true, email: true, institution: true } },
            },
          },
          documents: true,
          tasks: {
            include: {
              assignedTo: { select: { id: true, fullName: true, username: true } },
            },
          },
          comments: {
            include: {
              user: { select: { id: true, fullName: true, username: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          projectReviews: {
            include: {
              reviewer: { select: { id: true, fullName: true, username: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          owner: { select: { id: true, fullName: true, username: true, email: true, institution: true } },
        },
      });

      if (!project) {
        res.status(404).json({ message: 'Patent project not found.' });
        return;
      }

      const isAllowed = await policyFn(req.user, project, req);
      if (!isAllowed) {
        res.status(403).json({ message: 'Access denied. Forbidden by policy.' });
        return;
      }

      // Attach pre-fetched project to request
      req.project = project;
      next();
    } catch (error: any) {
      res.status(403).json({ message: error.message || 'Access denied.' });
    }
  };
};
