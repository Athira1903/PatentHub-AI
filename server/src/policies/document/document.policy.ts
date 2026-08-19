export class DocumentPolicy {
  /**
   * Resolve the conceptual project role for a user on a given project.
   */
  static getProjectRoleType(user: any, project: any): 'OWNER' | 'ADMIN' | 'EDITOR' | 'COMMENTER' | 'VIEWER' | null {
    if (!user) return null;
    if (user.role === 'Admin') return 'ADMIN';
    if (project.ownerId === user.userId) return 'OWNER';

    const member = project.members?.find((m: any) => m.userId === user.userId);
    if (!member) {
      const isGuide = user.role === 'Guide' || user.role === 'GUIDE';
      const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT';
      if (isGuide || isExpert) return 'COMMENTER';
      return null;
    }

    if (member.role === 'INVENTOR' || member.role === 'CO_INVENTOR') {
      if (member.permissionLevel === 'VIEW') {
        return 'VIEWER';
      }
      return 'EDITOR';
    }
    if (member.role === 'GUIDE' || member.role === 'PATENT_EXPERT') {
      return 'COMMENTER';
    }
    return 'VIEWER';
  }

  /**
   * Can upload documents. Only OWNER, ADMIN, or EDITOR.
   */
  static canUpload(user: any, project: any): boolean {
    const role = DocumentPolicy.getProjectRoleType(user, project);
    return role === 'OWNER' || role === 'ADMIN' || role === 'EDITOR';
  }

  /**
   * Can view documents. Any project member (OWNER, ADMIN, EDITOR, COMMENTER, VIEWER).
   */
  static canView(user: any, project: any, _document?: any): boolean {
    const role = DocumentPolicy.getProjectRoleType(user, project);
    return role !== null;
  }

  /**
   * Can download documents. Any project member.
   */
  static canDownload(user: any, project: any, document?: any): boolean {
    return DocumentPolicy.canView(user, project, document);
  }

  /**
   * Can edit documents. Only OWNER, ADMIN, or EDITOR.
   */
  static canEdit(user: any, project: any, _document?: any): boolean {
    const role = DocumentPolicy.getProjectRoleType(user, project);
    return role === 'OWNER' || role === 'ADMIN' || role === 'EDITOR';
  }

  /**
   * Can delete documents. Only OWNER, ADMIN, or EDITOR.
   */
  static canDelete(user: any, project: any, document?: any): boolean {
    return DocumentPolicy.canEdit(user, project, document);
  }

  /**
   * Can replace a document version. Only OWNER, ADMIN, or EDITOR.
   */
  static canReplaceVersion(user: any, project: any, _document?: any): boolean {
    return DocumentPolicy.canUpload(user, project);
  }

  /**
   * Can add a comment to a document. OWNER, ADMIN, EDITOR, or COMMENTER.
   */
  static canComment(user: any, project: any, _document?: any): boolean {
    const role = DocumentPolicy.getProjectRoleType(user, project);
    return role === 'OWNER' || role === 'ADMIN' || role === 'EDITOR' || role === 'COMMENTER';
  }
}
