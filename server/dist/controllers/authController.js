"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
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
const registerSchema = zod_1.z
    .object({
    fullName: zod_1.z
        .string()
        .trim()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name cannot exceed 100 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
    username: zod_1.z
        .string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .refine((val) => !RESERVED_USERNAMES.includes(val.toLowerCase()), {
        message: 'This username is reserved and cannot be used',
    }),
    email: zod_1.z
        .string()
        .trim()
        .toLowerCase()
        .email('Please enter a valid email address')
        .max(150, 'Email address is too long'),
    institution: zod_1.z.string().trim().max(150, 'Institution name cannot exceed 150 characters').optional(),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password cannot exceed 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character (!@#$%^&*)'),
    confirmPassword: zod_1.z.string().min(1, 'Please confirm your password'),
    role: zod_1.z.enum(['Inventor', 'Guide', 'CoInventor', 'PatentExpert', 'Admin']),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
const loginSchema = zod_1.z.object({
    emailOrUsername: zod_1.z.string().trim().min(1, 'Email or username is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const register = async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const result = await authService_1.AuthService.register({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.register = register;
const login = async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const result = await authService_1.AuthService.login(validatedData);
        res.status(200).json({
            message: 'Login successful',
            ...result,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.login = login;
const getProfile = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const profile = await authService_1.AuthService.getUserProfile(req.user.userId);
        res.status(200).json({
            status: 'success',
            user: profile,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch user profile' });
    }
};
exports.getProfile = getProfile;
