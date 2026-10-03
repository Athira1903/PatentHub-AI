export class ProjectPolicy {
  /**
   * Determine if the user can create a project.
   */
  static canCreateProject(user: any): boolean {
    return !!user && !!user.userId;
  }

  /**
   * Determine if the user can view a project.
   * Only owner, assigned members, or OrganizationAdmin of the same organization can view.
   */
  static canViewProject(user: any, project: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    if (user.role === 'OrganizationAdmin' && project.organizationId && user.organizationId === project.organizationId) {
      return true;
    }

    const isOwner = project.ownerId === user.userId;
    const isMember = project.members?.some((m: any) => m.userId === user.userId);

    return Boolean(isOwner || isMember);
  }

  /**
   * Determine if the user can edit a project.
   */
  static canEditProject(user: any, project: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    return project.ownerId === user.userId;
  }

  /**
   * Determine if the user can delete a project.
   */
  static canDeleteProject(user: any, project: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    return project.ownerId === user.userId;
  }

  /**
   * Determine if the user can archive a project.
   */
  static canArchiveProject(user: any, project: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    return project.ownerId === user.userId;
  }

  /**
   * Determine if the user can restore (unarchive) a project.
   */
  static canRestoreProject(user: any, project: any): boolean {
    return ProjectPolicy.canArchiveProject(user, project);
  }

  /**
   * Determine if the user can assign/invite a guide on a project.
   */
  static canAssignGuide(user: any, project: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    return project.ownerId === user.userId;
  }

  /**
   * Determine if a user can create a task for a project.
   * Only assigned supervisors (Guide, Expert), owner, or member with EDIT/SUBMIT can create tasks.
   */
  static canCreateTask(user: any, project: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    if (project.ownerId === user.userId) return true;

    const member = project.members?.find((m: any) => m.userId === user.userId);
    if (!member) return false;

    const isGuide = user.role === 'Guide' || user.role === 'GUIDE' || member.role === 'GUIDE';
    const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT' || member.role === 'PATENT_EXPERT';
    if (isGuide || isExpert) return true;

    // VIEW permission cannot create tasks
    return member.permissionLevel === 'EDIT' || member.permissionLevel === 'SUBMIT' || !member.permissionLevel;
  }

  /**
   * Determine if a user can update a task.
   */
  static canUpdateTask(user: any, project: any): boolean {
    return ProjectPolicy.canCreateTask(user, project);
  }

  /**
   * Determine if a user can delete a task.
   */
  static canDeleteTask(user: any, project: any): boolean {
    return ProjectPolicy.canCreateTask(user, project);
  }

  /**
   * Determine if a user can leave the project.
   * Project owner cannot leave the project; they must delete or transfer it.
   */
  static canLeaveProject(user: any, project: any): boolean {
    if (!user) return false;
    const isOwner = project.ownerId === user.userId;
    const isMember = project.members?.some((m: any) => m.userId === user.userId);

    return isMember && !isOwner;
  }
}
