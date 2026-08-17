"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationPolicy = void 0;
const db_1 = require("../../config/db");
class InvitationPolicy {
    /**
     * Determine if user can invite another user to a project.
     * Validates sender rights, existence of invitee, duplicate invitations, existing membership, and role compatibility.
     */
    static async canInvite(user, project, inviteeUsername, roleToInvite) {
        if (!user)
            return false;
        // Only Project Owner, Guide of the project, or Admin can invite users.
        const isOwner = project.ownerId === user.userId;
        const projectMember = project.members?.find((m) => m.userId === user.userId);
        const isGuideOnProject = projectMember?.role === 'GUIDE';
        const isAdmin = user.role === 'Admin';
        if (!isOwner && !isGuideOnProject && !isAdmin) {
            throw new Error('Access denied. Only the project owner, guide, or administrators can invite users.');
        }
        // 1. Fetch Invitee by username or email
        const trimmed = inviteeUsername.trim();
        let invitee = await db_1.prisma.user.findUnique({
            where: { username: trimmed },
            include: { role: true },
        });
        if (!invitee) {
            invitee = await db_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { username: trimmed },
                        { email: trimmed.toLowerCase() },
                    ],
                },
                include: { role: true },
            });
        }
        if (!invitee) {
            throw new Error(`User with username or email '${inviteeUsername}' not found.`);
        }
        if (invitee.id === user.userId) {
            throw new Error('You cannot invite yourself to a project.');
        }
        // 2. Validate Existing membership
        const existingMember = await db_1.prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId: project.id,
                    userId: invitee.id,
                },
            },
        });
        if (existingMember) {
            throw new Error('This user is already a member of the project.');
        }
        // 3. Validate Duplicate invitations
        const existingInvite = await db_1.prisma.invitation.findFirst({
            where: {
                projectId: project.id,
                receiverId: invitee.id,
                status: 'PENDING',
            },
        });
        if (existingInvite) {
            throw new Error('A pending invitation has already been sent to this user.');
        }
        return true;
    }
    /**
     * Determine if user can accept a project invitation.
     */
    static canAccept(user, invitation) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        return invitation.receiverId === user.userId;
    }
    /**
     * Determine if user can reject a project invitation.
     */
    static canReject(user, invitation) {
        return this.canAccept(user, invitation);
    }
    /**
     * Determine if user can remove a member from the project.
     * Only owner or admin can remove.
     */
    static canRemoveMember(user, project, memberId) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        return project.ownerId === user.userId;
    }
}
exports.InvitationPolicy = InvitationPolicy;
