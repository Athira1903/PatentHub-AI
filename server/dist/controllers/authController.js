"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const registerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    email: zod_1.z.string().email('Valid email address required'),
    institution: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod_1.z.string().min(6),
    role: zod_1.z.enum(['Inventor', 'Guide', 'CoInventor', 'PatentExpert', 'Admin']),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
const loginSchema = zod_1.z.object({
    emailOrUsername: zod_1.z.string().min(1, 'Email or username is required'),
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
        res.status(400).json({
            message: error.message || 'Registration failed',
            errors: error.errors || null,
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
        res.status(401).json({
            message: error.message || 'Login failed',
            errors: error.errors || null,
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
