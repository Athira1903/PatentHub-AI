"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.seedRoles = exports.DEFAULT_ROLES = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
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
class AuthService {
    static async register(input) {
        await (0, exports.seedRoles)();
        // Check if email or username already exists
        const existingEmail = await db_1.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (existingEmail) {
            throw new Error('User with this email already exists');
        }
        const existingUsername = await db_1.prisma.user.findUnique({
            where: { username: input.username },
        });
        if (existingUsername) {
            throw new Error('Username is already taken');
        }
        // Find role
        const role = await db_1.prisma.role.findUnique({
            where: { name: input.roleName },
        });
        if (!role) {
            throw new Error(`Invalid role selected: ${input.roleName}`);
        }
        const hashedPassword = await bcrypt_1.default.hash(input.password, 10);
        const user = await db_1.prisma.user.create({
            data: {
                fullName: input.fullName,
                username: input.username,
                email: input.email,
                password: hashedPassword,
                institution: input.institution || null,
                roleId: role.id,
            },
            include: {
                role: true,
            },
        });
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
        // User can login with either email OR username
        const user = await db_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: input.emailOrUsername },
                    { username: input.emailOrUsername },
                ],
            },
            include: {
                role: true,
            },
        });
        if (!user) {
            throw new Error('Invalid credentials');
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
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return {
            ...user,
            role: user.role.name,
        };
    }
}
exports.AuthService = AuthService;
