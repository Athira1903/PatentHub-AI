import { prisma } from '../../config/db';
import { ProjectRole } from '@prisma/client';

export class MembershipPolicy {
  /**
   * Check if user can add a member directly.
   */
  static canAddMember(user: any, project: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return project.ownerId === user.userId;
  }

  /**
   * Check if user can invite a member.
   */
  static async canInviteMember(
    user: any,
    project: any,
    inviteeUsername: string,
    roleToInvite: ProjectRole
  ): Promise<boolean> {
    if (!user) return false;

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
   * Check if user can accept invitation.
   */
  static canAcceptInvitation(user: any, invitation: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return invitation.receiverId === user.userId;
  }

  /**
   * Check if user can reject invitation.
   */
  static canRejectInvitation(user: any, invitation: any): boolean {
    return this.canAcceptInvitation(user, invitation);
  }

  /**
   * Check if user can remove a member.
   * Users cannot remove the project owner.
   */
  static canRemoveMember(user: any, project: any, memberId: string): boolean {
    if (!user) return false;

    // Users cannot remove project owner
    if (project.ownerId === memberId) {
      return false;
    }

    if (user.role === 'Admin') return true;
    return project.ownerId === user.userId;
  }

  /**
   * Check if user can change project role of a member.
   * Prevents changing own role or granting elevated permissions.
   */
  static canChangeProjectRole(
    user: any,
    project: any,
    memberId: string,
    newRole: ProjectRole
  ): boolean {
    if (!user) return false;

    // Cannot change project owner's role
    if (project.ownerId === memberId) {
      return false;
    }

    // Cannot change own project role (prevents self-elevation)
    if (user.userId === memberId && user.role !== 'Admin') {
      return false;
    }

    if (user.role === 'Admin') return true;
    return project.ownerId === user.userId;
  }
}
