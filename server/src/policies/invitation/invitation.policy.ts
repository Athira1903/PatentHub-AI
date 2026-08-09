import { prisma } from '../../config/db';
import { ProjectRole } from '@prisma/client';

export class InvitationPolicy {
  /**
   * Determine if user can invite another user to a project.
   * Validates sender rights, existence of invitee, duplicate invitations, existing membership, and role compatibility.
   */
  static async canInvite(
    user: any,
    project: any,
    inviteeUsername: string,
    roleToInvite: ProjectRole
  ): Promise<boolean> {
    if (!user) return false;

    // Only Project Owner, Guide of the project, or Admin can invite users.
    const isOwner = project.ownerId === user.userId;
    const projectMember = project.members?.find((m: any) => m.userId === user.userId);
    const isGuideOnProject = projectMember?.role === 'GUIDE';
    const isAdmin = user.role === 'Admin';

    if (!isOwner && !isGuideOnProject && !isAdmin) {
      throw new Error('Access denied. Only the project owner, guide, or administrators can invite users.');
    }

    // 1. Fetch Invitee
    const invitee = await prisma.user.findUnique({
      where: { username: inviteeUsername },
      include: { role: true },
    });
    if (!invitee) {
      throw new Error(`User with username '${inviteeUsername}' not found.`);
    }

    if (invitee.id === user.userId) {
      throw new Error('You cannot invite yourself to a project.');
    }

    // 2. Validate Existing membership
    const existingMember = await prisma.projectMember.findUnique({
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
    const existingInvite = await prisma.invitation.findFirst({
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
  static canAccept(user: any, invitation: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    return invitation.receiverId === user.userId;
  }

  /**
   * Determine if user can reject a project invitation.
   */
  static canReject(user: any, invitation: any): boolean {
    return this.canAccept(user, invitation);
  }

  /**
   * Determine if user can remove a member from the project.
   * Only owner or admin can remove.
   */
  static canRemoveMember(user: any, project: any, memberId: string): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    return project.ownerId === user.userId;
  }
}
