import { PatentFormPolicy } from '../forms/patent-form.policy';

export class ReviewPolicy {
  /**
   * Determine if the user can review the project.
   * Only assigned Guides and Patent Experts on the project (or Admin) can review.
   * Unassigned / external users cannot review.
   */
  static canReview(user: any, project: any): boolean {
    if (!user || !project) return false;
    if (user.role === 'Admin') return true;

    const projectMember = project.members?.find((m: any) => m.userId === user.userId);
    if (!projectMember) return false;

    const isGuide = user.role === 'Guide' || user.role === 'GUIDE';
    const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT';
    const role = projectMember.role;

    if (role === 'GUIDE' || (isGuide && role !== 'INVENTOR' && role !== 'CO_INVENTOR')) return true;
    if (role === 'PATENT_EXPERT' || (isExpert && role !== 'INVENTOR' && role !== 'CO_INVENTOR')) return true;

    return false;
  }

  /**
   * Determine if the user can approve a project review stage.
   * - Inventors cannot approve their own projects.
   * - Guide approval requires mandatory forms (Form 1, 2, 3, 5) to be complete.
   */
  static canApprove(user: any, project: any): boolean {
    if (!user || !project) return false;
    if (user.role === 'Admin') return true;

    // Inventors/owners cannot approve their own projects
    if (project.ownerId === user.userId) return false;

    const projectMember = project.members?.find((m: any) => m.userId === user.userId);
    if (!projectMember) return false;
    const role = projectMember.role;

    if (role === 'INVENTOR' || role === 'CO_INVENTOR') return false;

    const isGuide = user.role === 'Guide' || user.role === 'GUIDE';
    const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT';

    if (project.stage === 'GUIDE_REVIEW') {
      if (role !== 'GUIDE' && !isGuide) return false;
      return PatentFormPolicy.areMandatoryFormsComplete(project);
    }

    if (project.stage === 'PATENT_EXPERT_REVIEW') {
      if (role !== 'PATENT_EXPERT' && !isExpert) return false;
      return PatentFormPolicy.areMandatoryFormsComplete(project);
    }

    return false;
  }

  /**
   * Determine if the user can reject / request changes.
   * Only authorized reviewers (who are not the inventors) can reject or request changes.
   */
  static canReject(user: any, project: any): boolean {
    if (!user || !project) return false;
    if (user.role === 'Admin') return true;

    if (project.ownerId === user.userId) return false;

    const projectMember = project.members?.find((m: any) => m.userId === user.userId);
    if (!projectMember) return false;
    const role = projectMember.role;

    if (role === 'INVENTOR' || role === 'CO_INVENTOR') return false;

    const isGuide = user.role === 'Guide' || user.role === 'GUIDE';
    const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT';

    if (project.stage === 'GUIDE_REVIEW') {
      return role === 'GUIDE' || isGuide;
    }

    if (project.stage === 'PATENT_EXPERT_REVIEW') {
      return role === 'PATENT_EXPERT' || isExpert;
    }

    return false;
  }

  /**
   * Determine if the user can request changes.
   */
  static canRequestChanges(user: any, project: any): boolean {
    return ReviewPolicy.canReject(user, project);
  }

  /**
   * Determine if the user can comment.
   * Project owner, assigned members, or Admin can add comments.
   */
  static canComment(user: any, project: any): boolean {
    if (!user || !project) return false;
    if (user.role === 'Admin') return true;

    const isOwner = project.ownerId === user.userId;
    const isMember = project.members?.some((m: any) => m.userId === user.userId);

    return Boolean(isOwner || isMember);
  }

  /**
   * Determine if the user can view review audit records for the project.
   * Project owner, collaborators, guides, experts, and admin can view reviews.
   */
  static canViewReviews(user: any, project: any): boolean {
    return ReviewPolicy.canComment(user, project);
  }
}
