"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.googleLogin = exports.verifyOtpReset = exports.sendOtp = exports.getProfile = exports.login = exports.resendActivation = exports.activate = exports.register = void 0;
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
    accountType: zod_1.z.enum(['INDIVIDUAL', 'ORGANIZATION']).optional().default('INDIVIDUAL'),
    fullName: zod_1.z
        .string()
        .trim()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name cannot exceed 100 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
    email: zod_1.z
        .string()
        .trim()
        .toLowerCase()
        .email('Please enter a valid email address')
        .max(150, 'Email address is too long'),
    phone: zod_1.z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    institution: zod_1.z.string().trim().max(150, 'Institution name cannot exceed 150 characters').optional(),
    department: zod_1.z.string().trim().max(100, 'Department cannot exceed 100 characters').optional().default('General'),
    designation: zod_1.z.string().trim().max(100, 'Designation cannot exceed 100 characters').optional().default('Member'),
    userType: zod_1.z.enum([
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
    employeeOrStudentId: zod_1.z.string().trim().max(50).optional(),
    organizationName: zod_1.z.string().trim().max(150, 'Organization name cannot exceed 150 characters').optional(),
    organizationType: zod_1.z.string().trim().max(100).optional(),
    organizationDomain: zod_1.z.string().trim().max(100).optional(),
    organizationLocation: zod_1.z.string().trim().max(150).optional(),
})
    .superRefine((data, ctx) => {
    if (data.accountType === 'ORGANIZATION') {
        const orgName = data.organizationName || data.institution;
        if (!orgName || orgName.trim().length === 0) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Organization name is required for organization accounts',
                path: ['organizationName'],
            });
        }
    }
});
const activateSchema = zod_1.z.object({
    username: zod_1.z.string().trim().min(1, 'Username is required'),
    otp: zod_1.z.string().trim().length(6, 'OTP must be exactly 6 digits'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password cannot exceed 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});
const loginSchema = zod_1.z.object({
    identifier: zod_1.z.string().trim().min(1).optional(),
    emailOrUsername: zod_1.z.string().trim().min(1).optional(),
    password: zod_1.z.string().min(1, 'Password is required'),
}).refine(data => data.identifier || data.emailOrUsername, {
    message: 'Username or email is required',
    path: ['emailOrUsername'],
});
const register = async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const result = await authService_1.AuthService.register({
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
const activate = async (req, res) => {
    try {
        const validatedData = activateSchema.parse(req.body);
        const result = await authService_1.AuthService.activateAccount({
            username: validatedData.username,
            otp: validatedData.otp,
            newPassword: validatedData.password,
        });
        res.status(200).json({
            message: 'Account activated successfully',
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
            message: error.message || 'Activation failed',
        });
    }
};
exports.activate = activate;
const resendActivation = async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier || typeof identifier !== 'string') {
            res.status(400).json({ message: 'Please provide your generated username or registered email' });
            return;
        }
        const result = await authService_1.AuthService.resendActivationOtp(identifier.trim());
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({
            message: error.message || 'Failed to resend activation code',
        });
    }
};
exports.resendActivation = resendActivation;
const login = async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const identifier = validatedData.identifier || validatedData.emailOrUsername || '';
        const result = await authService_1.AuthService.login({
            emailOrUsername: identifier,
            password: validatedData.password,
        });
        res.status(200).json(result);
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
            message: error.message || 'Invalid credentials',
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
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes('@')) {
            res.status(400).json({ message: 'Please provide a valid email address' });
            return;
        }
        const result = await authService_1.AuthService.requestOtp(email);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to send OTP' });
    }
};
exports.sendOtp = sendOtp;
const verifyOtpReset = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            res.status(400).json({ message: 'Email, OTP, and new password are required' });
            return;
        }
        const result = await authService_1.AuthService.verifyOtpAndResetPassword(email, otp, newPassword);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to verify OTP' });
    }
};
exports.verifyOtpReset = verifyOtpReset;
const googleLogin = async (req, res) => {
    try {
        const { email, fullName, googleId } = req.body;
        if (!email || !email.includes('@')) {
            res.status(400).json({ message: 'Valid Google account email is required' });
            return;
        }
        const result = await authService_1.AuthService.googleLogin({
            email,
            fullName: fullName || email.split('@')[0],
            googleId,
        });
        res.status(200).json({
            message: 'Google sign in successful',
            ...result,
        });
    }
    catch (error) {
        res.status(400).json({
            message: error.message || 'Google Sign-In failed',
        });
    }
};
exports.googleLogin = googleLogin;
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z
        .string()
        .min(8, 'New password must be at least 8 characters')
        .max(100, 'Password cannot exceed 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
        const result = await authService_1.AuthService.changePassword(userId, currentPassword, newPassword);
        res.status(200).json(result);
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
            message: error.message || 'Failed to change password',
        });
    }
};
exports.changePassword = changePassword;
