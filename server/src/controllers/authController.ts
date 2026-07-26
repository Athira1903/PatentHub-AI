import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Valid email address required'),
  institution: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6),
  role: z.enum(['Inventor', 'Guide', 'CoInventor', 'PatentExpert', 'Admin']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const result = await AuthService.register({
      fullName: validatedData.fullName,
      username: validatedData.username,
      email: validatedData.email,
      institution: validatedData.institution,
      password: validatedData.password,
      roleName: validatedData.role,
    });

    res.status(201).json({
      message: 'Registration successful',
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Registration failed',
      errors: error.errors || null,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const result = await AuthService.login(validatedData);

    res.status(200).json({
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    res.status(401).json({
      message: error.message || 'Login failed',
      errors: error.errors || null,
    });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const profile = await AuthService.getUserProfile(req.user.userId);

    res.status(200).json({
      status: 'success',
      user: profile,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch user profile' });
  }
};
