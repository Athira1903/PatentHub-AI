import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  userId: string;
  id?: string;
  username: string;
  role: string;
  accountType?: 'INDIVIDUAL' | 'ORGANIZATION';
  organizationId?: string | null;
}

export interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user?: AuthenticatedUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access denied. No authentication token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'patenthub_secret'
    ) as {
      userId: string;
      username: string;
      role: string;
      accountType?: 'INDIVIDUAL' | 'ORGANIZATION';
      organizationId?: string | null;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token.' });
    return;
  }
};
