export class PatentFormPolicy {
  /**
   * Check if a specific form exists in the project's documents list.
   * Compares the document name (case-insensitive check for e.g. "Form 1" or "Form 1 ").
   */
  static hasForm(project: any, formNumber: string): boolean {
    if (!project || !project.documents) return false;
    const searchStr = `Form ${formNumber}`.toLowerCase();
    return project.documents.some((doc: any) =>
      doc.name.toLowerCase().includes(searchStr)
    );
  }

  /**
   * Validate dependencies for a specific form.
   * e.g., Form 2 cannot be submitted until Form 1 exists.
   */
  static validateDependencies(project: any, formType: string): boolean {
    if (formType === 'Form 2' || formType === '2') {
      // Form 2 cannot be submitted until Form 1 exists.
      return this.hasForm(project, '1');
    }
    return true;
  }

  /**
   * Verify if all mandatory forms (Form 1, 2, 3, 5) are complete for the project.
   */
  static areMandatoryFormsComplete(project: any): boolean {
    return (
      this.hasForm(project, '1') &&
      this.hasForm(project, '2') &&
      this.hasForm(project, '3') &&
      this.hasForm(project, '5')
    );
  }

  /**
   * Check if the user can create/fill a form.
   */
  static canCreate(user: any, project: any, formType: string): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    const isOwner = project.ownerId === user.userId;
    const projectMember = project.members?.find((m: any) => m.userId === user.userId);
    const isInventor = projectMember?.role === 'INVENTOR' || projectMember?.role === 'CO_INVENTOR';

    return isOwner || isInventor;
  }

  /**
   * Check if the user can view forms.
   */
  static canView(user: any, project: any, formType: string): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    const isOwner = project.ownerId === user.userId;
    const isMember = project.members?.some((m: any) => m.userId === user.userId);

    return isOwner || isMember;
  }

  /**
   * Check if the user can edit a form.
   */
  static canEdit(user: any, project: any, formType: string): boolean {
    return this.canCreate(user, project, formType);
  }

  /**
   * Check if the user can submit a form.
   */
  static canSubmit(user: any, project: any, formType: string): boolean {
    const hasCreatorRights = this.canCreate(user, project, formType);
    if (!hasCreatorRights) return false;

    // Check dependencies
    return this.validateDependencies(project, formType);
  }

  /**
   * Check if the user can approve a form.
   */
  static canApprove(user: any, project: any, formType: string): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    const projectMember = project.members?.find((m: any) => m.userId === user.userId);
    const projectRole = projectMember?.role;

    if (projectRole === 'GUIDE') {
      return this.areMandatoryFormsComplete(project);
    }

    if (projectRole === 'PATENT_EXPERT') {
      return this.areMandatoryFormsComplete(project);
    }

    return false;
  }
}
