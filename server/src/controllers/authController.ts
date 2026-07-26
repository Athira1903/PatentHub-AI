import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'system',
  'patenthub',
  'guest',
  'support',
  'null',
  'undefined',
  'api',
  'help',
  'user',
];

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .refine((val) => !RESERVED_USERNAMES.includes(val.toLowerCase()), {
        message: 'This username is reserved and cannot be used',
      }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(150, 'Email address is too long'),
    institution: z.string().trim().max(150, 'Institution name cannot exceed 150 characters').optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password cannot exceed 100 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character (!@#$%^&*)'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['Inventor', 'Guide', 'CoInventor', 'PatentExpert', 'Admin']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  emailOrUsername: z.string().trim().min(1, 'Email or username is required'),
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
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: error.errors[0]?.message || 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    res.status(400).json({
      message: error.message || 'Registration failed',
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
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: error.errors[0]?.message || 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    res.status(401).json({
      message: error.message || 'Login failed',
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
