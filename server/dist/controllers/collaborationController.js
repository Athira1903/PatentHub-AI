"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.updateMemberPermission = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUnreadNotificationsCount = exports.listMyNotifications = exports.listMyInvitations = exports.respondToInvitation = exports.inviteMember = void 0;
const db_1 = require("../config/db");
const client_1 = require("@prisma/client");
const mailService_1 = require("../services/mailService");
const membership_policy_1 = require("../policies/project/membership.policy");
const inviteMember = async (req, res) => {
    try {
        const senderId = req.user?.userId;
        if (!senderId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const { projectId, username, identifier, role, permissionLevel } = req.body; // role: 'INVENTOR' | 'CO_INVENTOR' | 'GUIDE' | 'PATENT_EXPERT'
        const targetQuery = (identifier || username || '').trim();
        if (!projectId || !targetQuery || !role) {
            res.status(400).json({ message: 'Project ID, identifier (email or username), and role are required.' });
            return;
        }
        if (!Object.values(client_1.ProjectRole).includes(role)) {
            res.status(400).json({ message: `Invalid project role: ${role}` });
            return;
        }
        const validPermissionLevel = permissionLevel && Object.values(client_1.PermissionLevel).includes(permissionLevel)
            ? permissionLevel
            : 'EDIT';
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
        });
        let receiver = await db_1.prisma.user.findUnique({
            where: { username: targetQuery },
        });
        if (!receiver) {
            receiver = await db_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { username: targetQuery },
                        { email: targetQuery.toLowerCase() },
                    ],
                },
            });
        }
        if (!project || !receiver) {
            res.status(404).json({ message: `User with identifier '${targetQuery}' or project was not found.` });
            return;
        }
        if (receiver.id === senderId) {
            res.status(400).json({ message: 'You cannot invite yourself to a project.' });
            return;
        }
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
                permissionLevel: validPermissionLevel,
                status: 'PENDING',
            },
        });
        // Create Persistent In-App Notification for the receiver
        const cleanRoleName = role.toLowerCase().replace('_', ' ');
        await db_1.prisma.notification.create({
            data: {
                userId: receiver.id,
                title: 'Collaboration Request',
                message: `${sender?.fullName || sender?.username} invited you to collaborate on "${project.title}" as ${cleanRoleName}.`,
                type: 'INVITATION',
                referenceId: invitation.id,
                projectId,
                metadata: {
                    invitationId: invitation.id,
                    projectId: project.id,
                    projectName: project.title,
                    senderName: sender?.fullName || sender?.username,
                    senderId: sender?.id,
                    role: role,
                },
            },
        });
        // Log Activity
        await db_1.prisma.activityLog.create({
            data: {
                userId: senderId,
                projectId,
                action: `Sent collaboration request to ${receiver.fullName} to join as ${cleanRoleName}.`,
                type: 'INVITATION',
            },
        });
        // Attempt email notification asynchronously (never blocks DB transaction)
        mailService_1.MailService.sendCollaborationInviteEmail(receiver.email, receiver.fullName, sender?.fullName || sender?.username || 'Lead Inventor', project.title, cleanRoleName).catch((err) => console.warn('[COLLABORATION EMAIL WARNING]', err?.message || err));
        res.status(201).json({
            message: `Collaboration request successfully sent to @${receiver.username}!`,
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
        let { invitationId, status, action } = req.body; // status: 'ACCEPTED' | 'REJECTED'
        if (!status && action) {
            status = action.toLowerCase() === 'accept' ? 'ACCEPTED' : action.toLowerCase() === 'reject' ? 'REJECTED' : undefined;
        }
        if (!invitationId || !status || !['ACCEPTED', 'REJECTED'].includes(status)) {
            res.status(400).json({ message: 'Invitation ID and valid response status (ACCEPTED/REJECTED) are required.' });
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
        if (invitation.status !== 'PENDING') {
            res.status(400).json({ message: `This invitation has already been ${invitation.status.toLowerCase()}.` });
            return;
        }
        if (invitation.receiverId !== receiverId) {
            res.status(403).json({ message: 'Access denied. This invitation was sent to another user.' });
            return;
        }
        if (!invitation.project) {
            res.status(404).json({ message: 'The associated project no longer exists.' });
            return;
        }
        if (status === 'ACCEPTED') {
            const existingMember = await db_1.prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId: invitation.projectId,
                        userId: receiverId,
                    },
                },
            });
            if (existingMember) {
                res.status(400).json({ message: 'You are already a member of this project.' });
                return;
            }
        }
        // Atomically update invitation status and create membership
        await db_1.prisma.$transaction(async (tx) => {
            await tx.invitation.update({
                where: { id: invitationId },
                data: { status },
            });
            if (status === 'ACCEPTED') {
                await tx.projectMember.create({
                    data: {
                        projectId: invitation.projectId,
                        userId: receiverId,
                        role: invitation.role,
                        permissionLevel: invitation.permissionLevel || 'EDIT',
                    },
                });
            }
            // Mark the original invitation notification as read
            await tx.notification.updateMany({
                where: {
                    userId: receiverId,
                    referenceId: invitationId,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
        });
        const cleanRoleName = invitation.role.toLowerCase().replace('_', ' ');
        if (status === 'ACCEPTED') {
            // Notify the original sender/inventor
            await db_1.prisma.notification.create({
                data: {
                    userId: invitation.senderId,
                    title: 'Collaboration Accepted',
                    message: `${invitation.receiver.fullName} accepted your collaboration request for "${invitation.project.title}".`,
                    type: 'COLLABORATION_ACCEPTED',
                    referenceId: invitation.projectId,
                    projectId: invitation.projectId,
                    metadata: {
                        projectId: invitation.projectId,
                        projectName: invitation.project.title,
                        receiverName: invitation.receiver.fullName,
                        role: invitation.role,
                    },
                },
            });
            // Log project activity
            await db_1.prisma.activityLog.create({
                data: {
                    userId: receiverId,
                    projectId: invitation.projectId,
                    action: `${invitation.receiver.fullName} joined the project as a ${cleanRoleName}.`,
                    type: 'INVITATION',
                },
            });
            // Attempt email dispatch asynchronously
            mailService_1.MailService.sendCollaborationResponseEmail(invitation.sender.email, invitation.sender.fullName, invitation.receiver.fullName, invitation.project.title, 'accepted').catch((err) => console.warn('[COLLABORATION EMAIL WARNING]', err?.message || err));
        }
        else {
            // Notify the sender about rejection
            await db_1.prisma.notification.create({
                data: {
                    userId: invitation.senderId,
                    title: 'Collaboration Declined',
                    message: `${invitation.receiver.fullName} declined your collaboration request for "${invitation.project.title}".`,
                    type: 'COLLABORATION_DECLINED',
                    referenceId: invitation.projectId,
                    projectId: invitation.projectId,
                    metadata: {
                        projectId: invitation.projectId,
                        projectName: invitation.project.title,
                        receiverName: invitation.receiver.fullName,
                        role: invitation.role,
                    },
                },
            });
            // Log activity
            await db_1.prisma.activityLog.create({
                data: {
                    userId: receiverId,
                    projectId: invitation.projectId,
                    action: `${invitation.receiver.fullName} declined the collaboration request for "${invitation.project.title}".`,
                    type: 'INVITATION',
                },
            });
            // Attempt email dispatch asynchronously
            mailService_1.MailService.sendCollaborationResponseEmail(invitation.sender.email, invitation.sender.fullName, invitation.receiver.fullName, invitation.project.title, 'declined').catch((err) => console.warn('[COLLABORATION EMAIL WARNING]', err?.message || err));
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
const notificationService_1 = require("../services/notificationService");
const listMyNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const notifications = await notificationService_1.NotificationService.listUserNotifications(userId);
        res.status(200).json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch notifications.' });
    }
};
exports.listMyNotifications = listMyNotifications;
const getUnreadNotificationsCount = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const count = await notificationService_1.NotificationService.getUnreadCount(userId);
        res.status(200).json({ success: true, count });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch unread notification count.' });
    }
};
exports.getUnreadNotificationsCount = getUnreadNotificationsCount;
const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const id = req.params.id;
        await notificationService_1.NotificationService.markNotificationRead(userId, id);
        res.status(200).json({ message: 'Notification marked as read.' });
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Notification not found or access denied.' });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const result = await notificationService_1.NotificationService.markAllNotificationsRead(userId);
        res.status(200).json({ message: 'All notifications marked as read.', count: result.count });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to mark all notifications as read.' });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
const updateMemberPermission = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const projectId = req.params.projectId;
        const memberId = req.params.memberId;
        const { permissionLevel } = req.body;
        if (!permissionLevel || !Object.values(client_1.PermissionLevel).includes(permissionLevel)) {
            res.status(400).json({ message: 'Valid permissionLevel (VIEW, EDIT, SUBMIT) is required.' });
            return;
        }
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: { members: true },
        });
        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }
        const canUpdate = membership_policy_1.MembershipPolicy.canUpdatePermissionLevel(req.user, project, memberId);
        if (!canUpdate) {
            res.status(403).json({ message: 'Access denied. Only project owners and administrators can adjust member permissions.' });
            return;
        }
        const updatedMember = await db_1.prisma.projectMember.update({
            where: {
                projectId_userId: {
                    projectId,
                    userId: memberId,
                },
            },
            data: {
                permissionLevel: permissionLevel,
            },
            include: {
                user: { select: { id: true, fullName: true, username: true } },
            },
        });
        // Log Activity
        await db_1.prisma.activityLog.create({
            data: {
                userId,
                projectId,
                action: `Updated permission level for ${updatedMember.user.fullName} to ${permissionLevel}.`,
                type: 'MEMBERSHIP',
            },
        });
        res.status(200).json({
            message: `Permission level updated to ${permissionLevel} for ${updatedMember.user.fullName}.`,
            member: updatedMember,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update member permission.' });
    }
};
exports.updateMemberPermission = updateMemberPermission;
const removeMember = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized.' });
            return;
        }
        const projectId = req.params.projectId;
        const memberId = req.params.memberId;
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: { members: true },
        });
        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }
        const canRemove = membership_policy_1.MembershipPolicy.canRemoveMember(req.user, project, memberId);
        if (!canRemove) {
            res.status(403).json({ message: 'Access denied. You cannot remove this member.' });
            return;
        }
        const existingMember = await db_1.prisma.projectMember.findFirst({
            where: {
                projectId,
                OR: [
                    { userId: memberId },
                    { id: memberId }
                ]
            },
            include: { user: { select: { fullName: true, username: true } } },
        });
        if (!existingMember) {
            res.status(404).json({ message: 'Member not found on this project.' });
            return;
        }
        await db_1.prisma.projectMember.delete({
            where: { id: existingMember.id },
        });
        await db_1.prisma.activityLog.create({
            data: {
                userId,
                projectId,
                action: `Removed collaborator ${existingMember.user.fullName} (@${existingMember.user.username}) from project.`,
                type: 'MEMBERSHIP',
            },
        });
        res.status(200).json({
            message: `Collaborator ${existingMember.user.fullName} removed successfully.`,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to remove member.' });
    }
};
exports.removeMember = removeMember;
