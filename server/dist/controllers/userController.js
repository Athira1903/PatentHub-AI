"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUsername = exports.listUsers = exports.toggleUserStatus = exports.promoteUser = exports.searchUsers = void 0;
const db_1 = require("../config/db");
const searchUsers = async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) {
            res.status(400).json({ message: 'Search query is required.' });
            return;
        }
        const users = await db_1.prisma.user.findMany({
            where: {
                username: {
                    contains: q.trim(),
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                institution: true,
                role: { select: { name: true } },
                profile: {
                    select: {
                        department: true,
                        profileImage: true,
                        researchDomain: true,
                    },
                },
            },
            take: 10,
        });
        const formatted = users.map((u) => ({
            id: u.id,
            fullName: u.fullName,
            username: u.username,
            email: u.email,
            institution: u.institution,
            role: u.role.name,
            department: u.profile?.department || null,
            profileImage: u.profile?.profileImage || null,
            researchDomain: u.profile?.researchDomain || null,
        }));
        res.status(200).json(formatted);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to search users.' });
    }
};
exports.searchUsers = searchUsers;
const promoteUser = async (req, res) => {
    try {
        // Only administrators can promote roles
        if (req.user?.role !== 'Admin') {
            res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
            return;
        }
        const id = req.params.id;
        const { roleName } = req.body; // 'Inventor' | 'Guide' | 'PatentExpert' | 'Admin'
        if (!roleName) {
            res.status(400).json({ message: 'Role name is required.' });
            return;
        }
        const role = await db_1.prisma.role.findUnique({
            where: { name: roleName },
        });
        if (!role) {
            res.status(400).json({ message: `Role '${roleName}' not found in database.` });
            return;
        }
        const updatedUser = (await db_1.prisma.user.update({
            where: { id },
            data: { roleId: role.id },
            include: { role: true },
        }));
        res.status(200).json({
            message: `Successfully promoted user to ${roleName}!`,
            user: {
                id: updatedUser.id,
                fullName: updatedUser.fullName,
                username: updatedUser.username,
                role: updatedUser.role.name,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to promote user.' });
    }
};
exports.promoteUser = promoteUser;
const toggleUserStatus = async (req, res) => {
    try {
        // Only administrators can toggle activation status
        if (req.user?.role !== 'Admin') {
            res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
            return;
        }
        const id = req.params.id;
        const user = await db_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        const updated = await db_1.prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
        });
        res.status(200).json({
            message: `User status changed to ${updated.isActive ? 'Active' : 'Inactive'}.`,
            isActive: updated.isActive,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to toggle user status.' });
    }
};
exports.toggleUserStatus = toggleUserStatus;
const listUsers = async (req, res) => {
    try {
        // Only administrators can list all platform users
        if (req.user?.role !== 'Admin') {
            res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
            return;
        }
        const users = await db_1.prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                institution: true,
                isActive: true,
                role: { select: { name: true } },
                profile: {
                    select: {
                        phone: true,
                        department: true,
                        profileImage: true,
                        researchDomain: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const formatted = users.map((u) => ({
            id: u.id,
            fullName: u.fullName,
            username: u.username,
            email: u.email,
            institution: u.institution,
            isActive: u.isActive,
            role: u.role.name,
            phone: u.profile?.phone || null,
            department: u.profile?.department || null,
            profileImage: u.profile?.profileImage || null,
            researchDomain: u.profile?.researchDomain || null,
        }));
        res.status(200).json(formatted);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to retrieve users list.' });
    }
};
exports.listUsers = listUsers;
const updateUsername = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const { username } = req.body;
        if (!username) {
            res.status(400).json({ message: 'Username is required.' });
            return;
        }
        const cleanUsername = username.trim();
        if (cleanUsername.length < 4 || cleanUsername.length > 30) {
            res.status(400).json({ message: 'Username must be between 4 and 30 characters.' });
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
            res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores.' });
            return;
        }
        const RESERVED = ['admin', 'administrator', 'system', 'patenthub', 'support'];
        if (RESERVED.includes(cleanUsername.toLowerCase())) {
            res.status(400).json({ message: 'This username is reserved.' });
            return;
        }
        const existing = await db_1.prisma.user.findUnique({
            where: { username: cleanUsername },
        });
        if (existing) {
            res.status(400).json({ message: 'Username is already taken.' });
            return;
        }
        const user = (await db_1.prisma.user.update({
            where: { id: userId },
            data: { username: cleanUsername },
            include: { role: true },
        }));
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role.name }, process.env.JWT_SECRET || 'patenthub_secret', { expiresIn: '7d' });
        res.status(200).json({
            message: 'Username updated successfully!',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                institution: user.institution,
                role: user.role.name,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update username.' });
    }
};
exports.updateUsername = updateUsername;
