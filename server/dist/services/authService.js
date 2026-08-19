"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.seedRoles = exports.DEFAULT_ROLES = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const mailService_1 = require("./mailService");
exports.DEFAULT_ROLES = ['Inventor', 'Guide', 'CoInventor', 'PatentExpert', 'Admin'];
// Ensure default roles exist in the database
const seedRoles = async () => {
    for (const roleName of exports.DEFAULT_ROLES) {
        await db_1.prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }
};
exports.seedRoles = seedRoles;
// In-Memory OTP Store for Password Resets
const otpStore = new Map();
class AuthService {
    static async register(input) {
        await (0, exports.seedRoles)();
        // Check if email already exists
        const existingEmail = await db_1.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (existingEmail) {
            throw new Error('User with this email already exists');
        }
        // Determine Role Name and prefix based on userType input
        let dbRoleName = 'Inventor';
        let prefix = 'STU2026';
        if (input.userType === 'Guide' || input.userType === 'Faculty Guide') {
            dbRoleName = 'Guide';
            prefix = 'GDE2026';
        }
        else if (input.userType === 'PatentExpert' || input.userType === 'Patent Expert') {
            dbRoleName = 'PatentExpert';
            prefix = 'PEX2026';
        }
        else if (input.userType === 'CoInventor' || input.userType === 'Co-Inventor') {
            dbRoleName = 'CoInventor';
            prefix = 'COI2026';
        }
        else if (input.userType === 'Admin' || input.userType === 'Administrator') {
            dbRoleName = 'Admin';
            prefix = 'ADM';
        }
        else if (input.userType === 'Inventor' || input.userType === 'Student') {
            dbRoleName = 'Inventor';
            prefix = 'STU2026';
        }
        const role = await db_1.prisma.role.upsert({
            where: { name: dbRoleName },
            update: {},
            create: { name: dbRoleName },
        });
        if (!role) {
            throw new Error(`Role '${dbRoleName}' not found in database.`);
        }
        // Auto-generate structured unique username
        let generatedUsername = '';
        const count = await db_1.prisma.user.count({
            where: { username: { startsWith: prefix } },
        });
        let offset = 0;
        while (true) {
            const seqNum = count + 1 + offset;
            let formattedSeq = '';
            if (prefix === 'ADM') {
                formattedSeq = String(seqNum).padStart(3, '0');
            }
            else if (prefix === 'STU2026') {
                formattedSeq = String(seqNum).padStart(5, '0');
            }
            else {
                formattedSeq = String(seqNum).padStart(4, '0');
            }
            generatedUsername = `${prefix}${formattedSeq}`;
            const exists = await db_1.prisma.user.findUnique({ where: { username: generatedUsername } });
            if (!exists)
                break;
            offset++;
        }
        // Generate 6-digit activation OTP and temp password hash
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const hashedPassword = await bcrypt_1.default.hash(tempPassword, 10);
        const user = await db_1.prisma.user.create({
            data: {
                fullName: input.fullName,
                username: generatedUsername,
                email: input.email,
                password: hashedPassword,
                institution: input.institution || null,
                roleId: role.id,
                isActive: false, // Inactive pending OTP verification
                employeeOrStudentId: input.employeeOrStudentId || null,
                activationOtp: otp,
                activationOtpExpires: otpExpires,
                profile: {
                    create: {
                        phone: input.phone,
                        dob: new Date('2000-01-01'), // Default placeholder
                        gender: 'Prefer not to say', // Default placeholder
                        institution: input.institution || '',
                        department: input.department,
                        designation: input.designation || 'Student',
                        organization: input.institution || null,
                        researchDomain: 'Computer Science', // Default placeholder
                        profileCompleted: false,
                    },
                },
            },
            include: {
                role: true,
                profile: true,
            },
        });
        // Send Activation Email
        const emailSent = await mailService_1.MailService.sendActivationEmail(user.email, user.fullName, user.username, otp);
        // Output code to console for easy developer validation
        console.log(`\n==================================================`);
        console.log(`[USER REGISTRATION SUCCESS]`);
        console.log(`FullName: ${user.fullName}`);
        console.log(`Generated Username: ${user.username}`);
        console.log(`Activation OTP: ${otp}`);
        console.log(`Email Sent Status: ${emailSent ? 'Delivered via SMTP' : 'Fallback / Local Only'}`);
        console.log(`==================================================\n`);
        return {
            user: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role.name,
            },
            emailSent,
        };
    }
    static async resendActivationOtp(identifier) {
        const trimmed = identifier.trim();
        const user = await db_1.prisma.user.findFirst({
            where: {
                OR: [
                    { username: trimmed },
                    { email: trimmed },
                ],
            },
            include: { role: true },
        });
        if (!user) {
            throw new Error('No user account found matching this username or email.');
        }
        if (user.isActive) {
            throw new Error('Account is already activated. Please sign in directly.');
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                activationOtp: otp,
                activationOtpExpires: otpExpires,
            },
        });
        const emailSent = await mailService_1.MailService.sendActivationEmail(user.email, user.fullName, user.username, otp);
        console.log(`\n==================================================`);
        console.log(`[RESEND ACTIVATION OTP SUCCESS]`);
        console.log(`FullName: ${user.fullName}`);
        console.log(`Username: ${user.username}`);
        console.log(`New Activation OTP: ${otp}`);
        console.log(`Email Sent Status: ${emailSent ? 'Delivered via SMTP' : 'Console / Fallback'}`);
        console.log(`==================================================\n`);
        return {
            message: 'New activation code generated and sent successfully.',
            username: user.username,
            email: user.email,
            emailSent,
        };
    }
    static async activateAccount(input) {
        const user = await db_1.prisma.user.findUnique({
            where: { username: input.username },
            include: { role: true },
        });
        if (!user) {
            throw new Error('User account not found');
        }
        if (user.isActive) {
            throw new Error('Account is already activated. Please login directly.');
        }
        if (!user.activationOtp || user.activationOtp !== input.otp) {
            throw new Error('Invalid activation code (OTP).');
        }
        if (user.activationOtpExpires && new Date() > user.activationOtpExpires) {
            throw new Error('Activation code (OTP) has expired.');
        }
        const hashedPassword = await bcrypt_1.default.hash(input.newPassword, 10);
        // Update password and activate user
        const updatedUser = await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                isActive: true,
                activationOtp: null,
                activationOtpExpires: null,
            },
        });
        // Create a new JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role.name }, process.env.JWT_SECRET || 'patenthub_secret', { expiresIn: '7d' });
        return {
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                institution: user.institution,
                role: user.role.name,
            },
        };
    }
    static async login(input) {
        const user = await db_1.prisma.user.findFirst({
            where: {
                OR: [
                    { username: input.emailOrUsername },
                    { email: input.emailOrUsername.toLowerCase() }
                ]
            },
            include: { role: true },
        });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (!user.isActive) {
            throw new Error('Account is not activated. Please use the activation code sent to your email to activate.');
        }
        const isPasswordMatch = await bcrypt_1.default.compare(input.password, user.password);
        if (!isPasswordMatch) {
            throw new Error('Invalid credentials');
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role.name }, process.env.JWT_SECRET || 'patenthub_secret', { expiresIn: '7d' });
        return {
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                institution: user.institution,
                role: user.role.name,
            },
        };
    }
    static async getUserProfile(userId) {
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                institution: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    select: { name: true },
                },
                profile: {
                    select: {
                        profileCompleted: true,
                        phone: true,
                        dob: true,
                        gender: true,
                        designation: true,
                        department: true,
                        organization: true,
                        researchDomain: true,
                        bio: true,
                        profileImage: true,
                    },
                },
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return {
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            institution: user.institution,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: user.role.name,
            profileCompleted: !!user.profile?.profileCompleted,
            phone: user.profile?.phone || '',
            department: user.profile?.department || '',
            dob: user.profile?.dob || null,
            gender: user.profile?.gender || '',
            designation: user.profile?.designation || '',
            researchDomain: user.profile?.researchDomain || '',
            bio: user.profile?.bio || '',
            profileImage: user.profile?.profileImage || null,
        };
    }
    static async requestOtp(email) {
        const cleanEmail = email.trim().toLowerCase();
        // Verify user exists before sending OTP
        const user = await db_1.prisma.user.findUnique({
            where: { email: cleanEmail },
        });
        if (!user) {
            throw new Error('No registered account found with this email address');
        }
        // Generate a 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        otpStore.set(cleanEmail, { code: otpCode, expiresAt });
        // Try sending email via SMTP
        const emailSent = await mailService_1.MailService.sendOtpEmail(cleanEmail, otpCode);
        if (emailSent) {
            return {
                message: `OTP sent successfully to ${cleanEmail}`,
            };
        }
        // Fallback if SMTP fails or is not configured
        console.log(`\n==============================================`);
        console.log(`[OTP SERVICE WARNING] SMTP was not configured or failed to send.`);
        console.log(`[OTP SERVICE] Password reset OTP for ${cleanEmail}: ${otpCode}`);
        console.log(`==============================================\n`);
        return {
            message: `OTP generated successfully (Dev Mode/console fallback) to ${cleanEmail}`,
        };
    }
    static async verifyOtpAndResetPassword(email, otp, newPassword) {
        const cleanEmail = email.trim().toLowerCase();
        const record = otpStore.get(cleanEmail);
        if (!record) {
            throw new Error('No OTP request found for this email. Please request a new OTP.');
        }
        if (Date.now() > record.expiresAt) {
            otpStore.delete(cleanEmail);
            throw new Error('OTP has expired. Please request a new code.');
        }
        if (record.code !== otp.trim()) {
            throw new Error('Invalid OTP code. Please check your 6-digit verification code.');
        }
        // Check if user exists
        const user = await db_1.prisma.user.findUnique({
            where: { email: cleanEmail },
        });
        if (!user) {
            throw new Error('No registered account found with this email address');
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await db_1.prisma.user.update({
            where: { email: cleanEmail },
            data: { password: hashedPassword },
        });
        otpStore.delete(cleanEmail);
        return {
            message: 'Password reset successfully. You can now log in with your new password.',
        };
    }
    static async googleLogin(input) {
        await (0, exports.seedRoles)();
        const cleanEmail = input.email.trim().toLowerCase();
        // Check if user already exists
        let user = await db_1.prisma.user.findUnique({
            where: { email: cleanEmail },
            include: { role: true },
        });
        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            // Assign a temporary unique username for new Google user signup
            let username = `temp_${Math.random().toString(36).substring(2, 12)}`;
            while (await db_1.prisma.user.findUnique({ where: { username } })) {
                username = `temp_${Math.random().toString(36).substring(2, 12)}`;
            }
            const role = await db_1.prisma.role.findUnique({
                where: { name: 'Inventor' },
            });
            if (!role) {
                throw new Error('Default role Inventor not found');
            }
            const randomPassword = await bcrypt_1.default.hash(Math.random().toString(36) + Date.now(), 10);
            const fullName = input.fullName || cleanEmail.split('@')[0];
            user = await db_1.prisma.user.create({
                data: {
                    fullName,
                    username,
                    email: cleanEmail,
                    password: randomPassword,
                    roleId: role.id,
                    profile: {
                        create: {
                            phone: '',
                            dob: new Date('2000-01-01'),
                            gender: 'Prefer not to say',
                            institution: '',
                            department: '',
                            designation: 'Student',
                            researchDomain: 'Computer Science',
                            profileCompleted: false,
                        },
                    },
                },
                include: { role: true },
            });
        }
        else {
            // If user exists but is not active (due to standard registration pending activation), activate them automatically
            if (!user.isActive) {
                user = await db_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        isActive: true,
                        activationOtp: null,
                        activationOtpExpires: null,
                    },
                    include: { role: true },
                });
            }
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role.name }, process.env.JWT_SECRET || 'patenthub_secret', { expiresIn: '7d' });
        const requireUsernameSelection = user.username.startsWith('temp_');
        return {
            token,
            requireUsernameSelection,
            user: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                institution: user.institution,
                role: user.role.name,
            },
        };
    }
}
exports.AuthService = AuthService;
