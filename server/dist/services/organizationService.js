"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../config/db");
const mailService_1 = require("./mailService");
const authService_1 = require("./authService");
class OrganizationService {
    /**
     * Fetch organization details by ID.
     */
    static async getOrganizationDetails(orgId) {
        const org = await db_1.prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                _count: {
                    select: {
                        users: true,
                        projects: true,
                        policies: true,
                    },
                },
            },
        });
        if (!org) {
            throw new Error('Organization not found.');
        }
        return org;
    }
    /**
     * Update organization details.
     */
    static async updateOrganizationDetails(orgId, data) {
        const org = await db_1.prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            throw new Error('Organization not found.');
        }
        return db_1.prisma.organization.update({
            where: { id: orgId },
            data: {
                ...(data.name && { name: data.name.trim() }),
                ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail?.trim() || null }),
                ...(data.contactNumber !== undefined && { contactNumber: data.contactNumber?.trim() || null }),
                ...(data.address !== undefined && { address: data.address?.trim() || null }),
                ...(data.location !== undefined && { location: data.location?.trim() || null }),
                ...(data.domain !== undefined && { domain: data.domain?.trim() || null }),
                ...(data.type !== undefined && { type: data.type?.trim() || null }),
            },
        });
    }
    /**
     * Get organization dashboard metrics computed strictly from real DB records.
     */
    static async getOrganizationDashboardMetrics(orgId) {
        const org = await db_1.prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true,
                name: true,
                domain: true,
                type: true,
                contactEmail: true,
                contactNumber: true,
                address: true,
                location: true,
                status: true,
                createdAt: true,
            },
        });
        if (!org) {
            throw new Error('Organization not found.');
        }
        const [totalInventors, totalGuides, totalPatentExperts, totalProjects, activePolicies, recentAssignments, recentProjects,] = await Promise.all([
            // Count Inventors
            db_1.prisma.user.count({
                where: {
                    organizationId: orgId,
                    role: { name: { in: ['Inventor', 'CoInventor'] } },
                },
            }),
            // Count Guides
            db_1.prisma.user.count({
                where: {
                    organizationId: orgId,
                    role: { name: 'Guide' },
                },
            }),
            // Count Patent Experts
            db_1.prisma.user.count({
                where: {
                    organizationId: orgId,
                    role: { name: 'PatentExpert' },
                },
            }),
            // Count Projects
            db_1.prisma.patentProject.count({
                where: {
                    organizationId: orgId,
                    isArchived: false,
                },
            }),
            // Count Active Policies
            db_1.prisma.policy.count({
                where: {
                    organizationId: orgId,
                    status: 'ACTIVE',
                },
            }),
            // Recent Policy Assignments
            db_1.prisma.policyAssignment.findMany({
                where: { organizationId: orgId },
                orderBy: { assignedAt: 'desc' },
                take: 5,
                include: {
                    policy: { select: { id: true, name: true } },
                    user: { select: { id: true, fullName: true, username: true, email: true, role: true } },
                    assignedBy: { select: { id: true, fullName: true, username: true } },
                },
            }),
            // Recent Projects
            db_1.prisma.patentProject.findMany({
                where: { organizationId: orgId, isArchived: false },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    owner: { select: { id: true, fullName: true, username: true } },
                },
            }),
        ]);
        return {
            organization: org,
            metrics: {
                totalInventors,
                totalGuides,
                totalPatentExperts,
                totalProjects,
                activePolicies,
            },
            recentAssignments,
            recentProjects,
        };
    }
    /**
     * Get all users belonging to an organization with role filtering and policy status.
     */
    static async getOrganizationUsers(orgId, roleFilter, statusFilter, search) {
        const whereClause = {
            organizationId: orgId,
        };
        if (roleFilter && roleFilter !== 'ALL') {
            if (roleFilter === 'INVENTORS' || roleFilter === 'Inventor') {
                whereClause.role = { name: { in: ['Inventor', 'CoInventor'] } };
            }
            else if (roleFilter === 'GUIDES' || roleFilter === 'Guide') {
                whereClause.role = { name: 'Guide' };
            }
            else if (roleFilter === 'PATENT_EXPERTS' || roleFilter === 'PatentExpert') {
                whereClause.role = { name: 'PatentExpert' };
            }
            else if (roleFilter === 'ADMINS' || roleFilter === 'OrganizationAdmin') {
                whereClause.role = { name: 'OrganizationAdmin' };
            }
            else {
                whereClause.role = { name: roleFilter };
            }
        }
        if (statusFilter && statusFilter !== 'ALL') {
            if (statusFilter === 'ACTIVE') {
                whereClause.isActive = true;
            }
            else if (statusFilter === 'INACTIVE' || statusFilter === 'PENDING') {
                whereClause.isActive = false;
            }
        }
        if (search && search.trim()) {
            const q = search.trim();
            whereClause.OR = [
                { fullName: { contains: q, mode: 'insensitive' } },
                { username: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
            ];
        }
        const users = await db_1.prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                isActive: true,
                createdAt: true,
                employeeOrStudentId: true,
                role: {
                    select: { id: true, name: true },
                },
                profile: {
                    select: {
                        phone: true,
                        department: true,
                        designation: true,
                        profileImage: true,
                    },
                },
                assignedPolicies: {
                    where: { status: 'ACTIVE' },
                    select: {
                        id: true,
                        policy: { select: { id: true, name: true } },
                        assignedAt: true,
                        expiresAt: true,
                        status: true,
                    },
                },
                _count: {
                    select: {
                        ownedProjects: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return users.map((u) => ({
            ...u,
            roleName: u.role.name,
            activePoliciesCount: u.assignedPolicies.length,
            hasActivePolicy: u.assignedPolicies.length > 0,
            policies: u.assignedPolicies.map((ap) => ({
                assignmentId: ap.id,
                policyId: ap.policy.id,
                policyName: ap.policy.name,
                assignedAt: ap.assignedAt,
                expiresAt: ap.expiresAt,
                status: ap.status,
            })),
        }));
    }
    /**
     * Get organization projects.
     */
    static async getOrganizationProjects(orgId, search, stage) {
        const whereClause = {
            organizationId: orgId,
            isArchived: false,
        };
        if (stage && stage !== 'ALL') {
            whereClause.stage = stage;
        }
        if (search && search.trim()) {
            const q = search.trim();
            whereClause.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { technicalDomain: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
            ];
        }
        return db_1.prisma.patentProject.findMany({
            where: whereClause,
            include: {
                owner: {
                    select: { id: true, fullName: true, username: true, email: true },
                },
                members: {
                    include: {
                        user: { select: { id: true, fullName: true, username: true, role: true } },
                    },
                },
                _count: {
                    select: {
                        documents: true,
                        tasks: true,
                        projectReviews: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Add / invite a user directly into the organization.
     */
    static async addUserToOrganization(orgId, _adminUserId, data) {
        await (0, authService_1.seedRoles)();
        const org = await db_1.prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            throw new Error('Organization not found.');
        }
        const email = data.email.trim().toLowerCase();
        const existing = await db_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error('User with this email already exists.');
        }
        // Determine Role and prefix
        let dbRoleName = 'Inventor';
        let prefix = 'STU2026';
        if (data.roleName === 'Guide' || data.roleName === 'Faculty Guide') {
            dbRoleName = 'Guide';
            prefix = 'GDE2026';
        }
        else if (data.roleName === 'PatentExpert' || data.roleName === 'Patent Expert') {
            dbRoleName = 'PatentExpert';
            prefix = 'PEX2026';
        }
        else if (data.roleName === 'CoInventor' || data.roleName === 'Co-Inventor') {
            dbRoleName = 'CoInventor';
            prefix = 'COI2026';
        }
        else if (data.roleName === 'OrganizationAdmin' || data.roleName === 'Organization Admin') {
            dbRoleName = 'OrganizationAdmin';
            prefix = 'OAD2026';
        }
        const role = await db_1.prisma.role.upsert({
            where: { name: dbRoleName },
            update: {},
            create: { name: dbRoleName },
        });
        // Auto-generate username
        let generatedUsername = '';
        const count = await db_1.prisma.user.count({ where: { username: { startsWith: prefix } } });
        let offset = 0;
        while (true) {
            const candidate = `${prefix}${String(count + 1 + offset).padStart(prefix.length > 3 ? 4 : 5, '0')}`;
            const exists = await db_1.prisma.user.findUnique({ where: { username: candidate } });
            if (!exists) {
                generatedUsername = candidate;
                break;
            }
            offset++;
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const hashedPassword = await bcrypt_1.default.hash(tempPassword, 10);
        const user = await db_1.prisma.user.create({
            data: {
                fullName: data.fullName.trim(),
                username: generatedUsername,
                email,
                password: hashedPassword,
                institution: org.name,
                accountType: 'ORGANIZATION',
                organizationId: orgId,
                roleId: role.id,
                isActive: false,
                employeeOrStudentId: data.employeeOrStudentId?.trim() || null,
                activationOtp: otp,
                activationOtpExpires: otpExpires,
                profile: {
                    create: {
                        phone: data.phone?.trim() || '',
                        dob: new Date('2000-01-01'),
                        gender: 'Prefer not to say',
                        institution: org.name,
                        department: data.department?.trim() || 'General',
                        designation: data.designation?.trim() || (dbRoleName === 'Guide' ? 'Faculty Guide' : dbRoleName === 'PatentExpert' ? 'Patent Specialist' : 'Member'),
                        organization: org.name,
                        researchDomain: 'Technology',
                        profileCompleted: false,
                    },
                },
            },
            include: {
                role: true,
                organization: true,
            },
        });
        const emailSent = await mailService_1.MailService.sendActivationEmail(user.email, user.fullName, user.username, otp);
        return {
            message: 'User invited successfully.',
            user: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role.name,
                accountType: user.accountType,
                organizationId: user.organizationId,
            },
            emailSent,
        };
    }
}
exports.OrganizationService = OrganizationService;
