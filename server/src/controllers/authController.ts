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
    accountType: z.enum(['INDIVIDUAL', 'ORGANIZATION']).optional().default('INDIVIDUAL'),
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(150, 'Email address is too long'),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    institution: z.string().trim().max(150, 'Institution name cannot exceed 150 characters').optional(),
    department: z.string().trim().max(100, 'Department cannot exceed 100 characters').optional().default('General'),
    designation: z.string().trim().max(100, 'Designation cannot exceed 100 characters').optional().default('Member'),
    userType: z.enum([
      'Student',
      'Guide',
      'PatentExpert',
      'Admin',
      'Inventor',
      'CoInventor',
      'Co-Inventor',
      'Patent Expert',
      'Administrator',
    ]),
    employeeOrStudentId: z.string().trim().max(50).optional(),
    organizationName: z.string().trim().max(150, 'Organization name cannot exceed 150 characters').optional(),
    organizationType: z.string().trim().max(100).optional(),
    organizationDomain: z.string().trim().max(100).optional(),
    organizationLocation: z.string().trim().max(150).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === 'ORGANIZATION') {
      const orgName = data.organizationName || data.institution;
      if (!orgName || orgName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Organization name is required for organization accounts',
          path: ['organizationName'],
        });
      }
    }
  });

const activateSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1).optional(),
  emailOrUsername: z.string().trim().min(1).optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(data => data.identifier || data.emailOrUsername, {
  message: 'Username or email is required',
  path: ['emailOrUsername'],
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const result = await AuthService.register({
      accountType: validatedData.accountType,
      fullName: validatedData.fullName,
      email: validatedData.email,
      phone: validatedData.phone,
      institution: validatedData.institution || validatedData.organizationName,
      department: validatedData.department || 'General',
      designation: validatedData.designation || (validatedData.accountType === 'ORGANIZATION' ? 'Member' : 'Student'),
      userType: validatedData.userType,
      employeeOrStudentId: validatedData.employeeOrStudentId,
      organizationName: validatedData.organizationName || validatedData.institution,
      organizationType: validatedData.organizationType,
      organizationDomain: validatedData.organizationDomain,
      organizationLocation: validatedData.organizationLocation,
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email for activation credentials.',
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

export const activate = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = activateSchema.parse(req.body);

    const result = await AuthService.activateAccount({
      username: validatedData.username,
      otp: validatedData.otp,
      newPassword: validatedData.password,
    });

    res.status(200).json({
      message: 'Account activated successfully',
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
      message: error.message || 'Activation failed',
    });
  }
};

export const resendActivation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string') {
      res.status(400).json({ message: 'Please provide your generated username or registered email' });
      return;
    }

    const result = await AuthService.resendActivationOtp(identifier.trim());
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to resend activation code',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const identifier = validatedData.identifier || validatedData.emailOrUsername || '';

    const result = await AuthService.login({
      emailOrUsername: identifier,
      password: validatedData.password,
    });

    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: error.errors[0]?.message || 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    res.status(401).json({
      message: error.message || 'Invalid credentials',
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

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ message: 'Please provide a valid email address' });
      return;
    }

    const result = await AuthService.requestOtp(email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to send OTP' });
  }
};

export const verifyOtpReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ message: 'Email, OTP, and new password are required' });
      return;
    }

    const result = await AuthService.verifyOtpAndResetPassword(email, otp, newPassword);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to verify OTP' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, fullName, googleId } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400).json({ message: 'Valid Google account email is required' });
      return;
    }

    const result = await AuthService.googleLogin({
      email,
      fullName: fullName || email.split('@')[0],
      googleId,
    });

    res.status(200).json({
      message: 'Google sign in successful',
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Google Sign-In failed',
    });
  }
};

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const result = await AuthService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: error.errors[0]?.message || 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    res.status(400).json({
      message: error.message || 'Failed to change password',
    });
  }
};
