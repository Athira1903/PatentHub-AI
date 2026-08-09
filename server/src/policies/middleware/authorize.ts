import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

/**
   * Generic functional authorization middleware.
   * Receives a policy evaluator function and checks it against the authenticated user and request.
   */
export const authorize = (
  policyEvaluator: (user: any, req: any) => boolean | Promise<boolean>
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Access denied. Unauthorized.' });
        return;
      }

      const isAllowed = await policyEvaluator(req.user, req);
      if (!isAllowed) {
        res.status(403).json({ message: 'Access denied. Forbidden by policy.' });
        return;
      }

      next();
    } catch (error: any) {
      res.status(403).json({ message: error.message || 'Access denied.' });
    }
  };
};
