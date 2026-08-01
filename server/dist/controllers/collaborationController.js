"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationAsRead = exports.listMyNotifications = exports.listMyInvitations = exports.respondToInvitation = exports.inviteMember = void 0;
const db_1 = require("../config/db");
const client_1 = require("@prisma/client");
const inviteMember = async (req, res) => {
    try {
        const senderId = req.user?.userId;
        if (!senderId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const { projectId, username, role } = req.body; // role: 'INVENTOR' | 'CO_INVENTOR' | 'GUIDE' | 'PATENT_EXPERT'
        if (!projectId || !username || !role) {
            res.status(400).json({ message: 'Project ID, username, and role are required.' });
            return;
        }
        // Verify role value is valid ProjectRole enum
        if (!Object.values(client_1.ProjectRole).includes(role)) {
            res.status(400).json({ message: `Invalid project role: ${role}` });
            return;
        }
        // Check project exists
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: { owner: true },
        });
        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }
        // Check receiver exists
        const receiver = await db_1.prisma.user.findUnique({
            where: { username },
        });
        if (!receiver) {
            res.status(404).json({ message: `User with username '${username}' not found.` });
            return;
        }
        if (receiver.id === senderId) {
            res.status(400).json({ message: 'You cannot invite yourself to a project.' });
            return;
        }
        // Check if receiver is already a member
        const existingMember = await db_1.prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: receiver.id,
                },
            },
        });
        if (existingMember) {
            res.status(400).json({ message: 'This user is already a member of the project.' });
            return;
        }
        // Check if there is already a pending invitation
        const existingInvite = await db_1.prisma.invitation.findFirst({
            where: {
                projectId,
                receiverId: receiver.id,
                status: 'PENDING',
            },
        });
        if (existingInvite) {
            res.status(400).json({ message: 'A pending invitation has already been sent to this user.' });
            return;
        }
        // Fetch sender details
        const sender = await db_1.prisma.user.findUnique({
            where: { id: senderId },
        });
        // Create invitation
        const invitation = await db_1.prisma.invitation.create({
            data: {
                projectId,
                senderId,
                receiverId: receiver.id,
                role: role,
                status: 'PENDING',
            },
        });
        // Create Notification for the receiver
        const cleanRoleName = role.toLowerCase().replace('_', ' ');
        await db_1.prisma.notification.create({
            data: {
                userId: receiver.id,
                title: 'Project Invitation',
                message: `${sender?.fullName || sender?.username} invited you to join "${project.title}" as a ${cleanRoleName}.`,
                type: 'INVITATION',
                referenceId: invitation.id,
            },
        });
        // Log Activity
        await db_1.prisma.activityLog.create({
            data: {
                userId: senderId,
                projectId,
                action: `Sent invitation to ${receiver.fullName} to join as ${cleanRoleName}.`,
            },
        });
        res.status(201).json({
            message: `Invitation successfully sent to @${username}!`,
            invitation,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to send invitation.' });
    }
};
exports.inviteMember = inviteMember;
const respondToInvitation = async (req, res) => {
    try {
        const receiverId = req.user?.userId;
        if (!receiverId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const { invitationId, status } = req.body; // status: 'ACCEPTED' | 'REJECTED'
        if (!invitationId || !status || !['ACCEPTED', 'REJECTED'].includes(status)) {
            res.status(400).json({ message: 'Invitation ID and response status (ACCEPTED/REJECTED) are required.' });
            return;
        }
        const invitation = await db_1.prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                project: true,
                sender: true,
                receiver: true,
            },
        });
        if (!invitation) {
            res.status(404).json({ message: 'Invitation not found.' });
            return;
        }
        if (invitation.receiverId !== receiverId) {
            res.status(403).json({ message: 'Access denied. You are not the recipient of this invitation.' });
            return;
        }
        if (invitation.status !== 'PENDING') {
            res.status(400).json({ message: `This invitation has already been ${invitation.status.toLowerCase()}.` });
            return;
        }
        // Update invitation status
        await db_1.prisma.invitation.update({
            where: { id: invitationId },
            data: { status },
        });
        const cleanRoleName = invitation.role.toLowerCase().replace('_', ' ');
        if (status === 'ACCEPTED') {
            // Add to Project Members
            await db_1.prisma.projectMember.create({
                data: {
                    projectId: invitation.projectId,
                    userId: receiverId,
                    role: invitation.role,
                },
            });
            // Notify the sender
            await db_1.prisma.notification.create({
                data: {
                    userId: invitation.senderId,
                    title: 'Invitation Accepted',
                    message: `${invitation.receiver.fullName} has accepted your invitation to join "${invitation.project.title}" as a ${cleanRoleName}.`,
                    type: 'GENERAL',
                    referenceId: invitation.projectId,
                },
            });
            // Log project activity
            await db_1.prisma.activityLog.create({
                data: {
                    userId: receiverId,
                    projectId: invitation.projectId,
                    action: `${invitation.receiver.fullName} joined the project as a ${cleanRoleName}.`,
                },
            });
        }
        else {
            // Notify the sender about rejection
            await db_1.prisma.notification.create({
                data: {
                    userId: invitation.senderId,
                    title: 'Invitation Declined',
                    message: `${invitation.receiver.fullName} declined your invitation to join "${invitation.project.title}".`,
                    type: 'GENERAL',
                    referenceId: invitation.projectId,
                },
            });
        }
        res.status(200).json({
            message: `Invitation successfully ${status.toLowerCase()}!`,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to respond to invitation.' });
    }
};
exports.respondToInvitation = respondToInvitation;
const listMyInvitations = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const invitations = await db_1.prisma.invitation.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING',
            },
            include: {
                project: {
                    select: {
                        title: true,
                        innovationIdea: true,
                        technicalDomain: true,
                    },
                },
                sender: {
                    select: {
                        fullName: true,
                        username: true,
                        institution: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(invitations);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch invitations.' });
    }
};
exports.listMyInvitations = listMyInvitations;
const listMyNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const notifications = await db_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch notifications.' });
    }
};
exports.listMyNotifications = listMyNotifications;
const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const id = req.params.id;
        const notification = await db_1.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification) {
            res.status(404).json({ message: 'Notification not found.' });
            return;
        }
        if (notification.userId !== userId) {
            res.status(403).json({ message: 'Access denied.' });
            return;
        }
        await db_1.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
        res.status(200).json({ message: 'Notification marked as read.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update notification.' });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
