import { ProjectRole } from '@prisma/client';

export class PatentReferencePolicy {
  /**
   * Resolves the user's project-scoped role type.
   */
  static getProjectRoleType(user: any, project: any): 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | null {
    if (!user) return null;
    if (user.role === 'Admin') return 'ADMIN';
    if (project.ownerId === user.userId) return 'OWNER';

    const member = project.members?.find((m: any) => m.userId === user.userId);
    if (!member) {
      const isGuide = user.role === 'Guide' || user.role === 'GUIDE';
      const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT';
      if (isGuide || isExpert) return 'VIEWER';
      return null;
    }

    if (member.role === ProjectRole.INVENTOR || member.role === ProjectRole.CO_INVENTOR) {
      return 'EDITOR';
    }

    if (member.role === ProjectRole.GUIDE || member.role === ProjectRole.PATENT_EXPERT) {
      return 'VIEWER';
    }

    return 'VIEWER';
  }

  /**
   * Can search patents. Any project member (OWNER, ADMIN, EDITOR, VIEWER).
   */
  static canSearch(user: any, project: any): boolean {
    return PatentReferencePolicy.getProjectRoleType(user, project) !== null;
  }

  /**
   * Can view saved references. Any project member.
   */
  static canViewReferences(user: any, project: any): boolean {
    return PatentReferencePolicy.getProjectRoleType(user, project) !== null;
  }

  /**
   * Can save a reference. Only OWNER, ADMIN, or EDITOR (INVENTOR/CO_INVENTOR).
   */
  static canSaveReference(user: any, project: any): boolean {
    const role = PatentReferencePolicy.getProjectRoleType(user, project);
    return role === 'OWNER' || role === 'ADMIN' || role === 'EDITOR';
  }

  /**
   * Can delete a reference. Only OWNER, ADMIN, or EDITOR.
   */
  static canDeleteReference(user: any, project: any): boolean {
    const role = PatentReferencePolicy.getProjectRoleType(user, project);
    return role === 'OWNER' || role === 'ADMIN' || role === 'EDITOR';
  }

  /**
   * Can run AI similarity/novelty check on saved references. Any project member.
   */
  static canRunAiAnalysis(user: any, project: any): boolean {
    return PatentReferencePolicy.getProjectRoleType(user, project) !== null;
  }
}
