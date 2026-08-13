import { prisma } from '../config/db';
import { PatentForm } from '@prisma/client';

export const SUPPORTED_FORM_TYPES = ['Form 1', 'Form 2', 'Form 3', 'Form 5', 'Form 26'];

export class FormService {
  /**
   * Normalizes input form type string to standard "Form X" format.
   */
  static normalizeFormType(input: string): string {
    if (!input) return 'Form 1';
    const trimmed = input.trim();
    if (/^form[\s_]*1$/i.test(trimmed) || trimmed === '1') return 'Form 1';
    if (/^form[\s_]*2$/i.test(trimmed) || trimmed === '2') return 'Form 2';
    if (/^form[\s_]*3$/i.test(trimmed) || trimmed === '3') return 'Form 3';
    if (/^form[\s_]*5$/i.test(trimmed) || trimmed === '5') return 'Form 5';
    if (/^form[\s_]*26$/i.test(trimmed) || trimmed === '26') return 'Form 26';
    return trimmed;
  }

  /**
   * Auto-generates initial pre-filled form fields from project & owner metadata.
   */
  static generateDefaultFormData(project: any, formType: string): Record<string, any> {
    const ownerName = project.owner?.fullName || 'Natural Person';
    const ownerEmail = project.owner?.email || '';
    const ownerInstitution = project.owner?.institution || 'Registry Institution';
    const coInventors = project.members
      ?.filter((m: any) => m.role === 'INVENTOR' || m.role === 'CO_INVENTOR')
      ?.map((m: any) => `${m.user.fullName} (${m.user.email})`) || [];

    switch (formType) {
      case 'Form 1':
        return {
          applicantType: 'Natural Person',
          applicantName: ownerName,
          nationality: 'Indian',
          address: ownerInstitution,
          email: ownerEmail,
          title: project.title,
          category: project.category,
          inventors: [ownerName, ...coInventors],
          state: 'State Default',
          country: 'India'
        };
      case 'Form 2':
        return {
          specificationType: 'COMPLETE', // PROVISIONAL or COMPLETE
          title: project.title,
          preamble: 'The following specification particularly describes the invention and the manner in which it is to be performed.',
          abstract: project.innovationIdea,
          problemStatement: project.problemStatement,
          proposedSolution: project.proposedSolution,
          novelFeatures: project.novelFeatures || '',
          claimsCount: 1,
          claimsText: `1. A computer-implemented or technical system for ${project.title}, comprising: ${project.proposedSolution}`
        };
      case 'Form 3':
        return {
          applicantName: ownerName,
          title: project.title,
          undertakingText: 'I/We hereby declare that we have not made any application for a patent for the same or substantially the same invention outside India except those declared herein.',
          foreignApplications: []
        };
      case 'Form 5':
        return {
          applicantName: ownerName,
          title: project.title,
          declarationText: `I/We, the true and first inventors for the patent project titled "${project.title}", hereby confirm our inventorship credentials under IPO rules.`,
          isTrueAndFirstInventors: true
        };
      case 'Form 26':
        return {
          authoriserName: ownerName,
          title: project.title,
          agentName: 'Registered Patent Agent / Attorney',
          agentRegistrationNumber: 'IN/PA-XXXX',
          authorizationScope: `To act, represent, file and prosecute the patent specification titled "${project.title}" on behalf of the applicant.`
        };
      default:
        return { title: project.title };
    }
  }

  /**
   * Retrieves all forms for a project.
   * Auto-populates any missing standard IPO forms (Form 1, 2, 3, 5, 26) into DB.
   */
  static async getProjectForms(projectId: string): Promise<PatentForm[]> {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { fullName: true, email: true, institution: true } },
        members: { include: { user: { select: { fullName: true, email: true } } } }
      }
    });

    if (!project) {
      throw new Error('Project not found.');
    }

    const existingForms = await prisma.patentForm.findMany({
      where: { projectId },
      orderBy: { formType: 'asc' }
    });

    const existingTypes = new Set(existingForms.map(f => f.formType));

    // Ensure default records exist for mandatory & supported forms
    for (const formType of SUPPORTED_FORM_TYPES) {
      if (!existingTypes.has(formType)) {
        const defaultData = this.generateDefaultFormData(project, formType);
        await prisma.patentForm.create({
          data: {
            projectId,
            formType,
            formData: defaultData,
            status: 'DRAFT',
            version: 1,
            createdBy: project.ownerId
          }
        });
      }
    }

    return prisma.patentForm.findMany({
      where: { projectId },
      orderBy: { formType: 'asc' }
    });
  }

  /**
   * Retrieves a single form by ID.
   */
  static async getFormById(projectId: string, formId: string): Promise<PatentForm> {
    const form = await prisma.patentForm.findUnique({
      where: { id: formId }
    });

    if (!form || form.projectId !== projectId) {
      throw new Error('Patent form not found or project mismatch.');
    }

    return form;
  }

  /**
   * Upserts or updates structured form data for a project.
   */
  static async saveForm(
    projectId: string,
    rawFormType: string,
    formData: any,
    userId?: string
  ): Promise<PatentForm> {
    const formType = this.normalizeFormType(rawFormType);

    if (!SUPPORTED_FORM_TYPES.includes(formType)) {
      throw new Error(`Unsupported patent form type: "${rawFormType}". Supported types: ${SUPPORTED_FORM_TYPES.join(', ')}`);
    }

    const existing = await prisma.patentForm.findUnique({
      where: {
        projectId_formType: {
          projectId,
          formType
        }
      }
    });

    if (existing) {
      const isApproved = existing.status === 'APPROVED';
      const nextVersion = isApproved ? existing.version + 1 : existing.version;

      return prisma.patentForm.update({
        where: { id: existing.id },
        data: {
          formData: formData || existing.formData,
          status: isApproved ? 'DRAFT' : existing.status,
          version: nextVersion,
          updatedAt: new Date()
        }
      });
    }

    return prisma.patentForm.create({
      data: {
        projectId,
        formType,
        formData: formData || {},
        status: 'DRAFT',
        version: 1,
        createdBy: userId
      }
    });
  }

  /**
   * Submits a form, marking its status as SUBMITTED.
   */
  static async submitForm(projectId: string, formId: string, userId: string): Promise<PatentForm> {
    const form = await this.getFormById(projectId, formId);

    const updated = await prisma.patentForm.update({
      where: { id: form.id },
      data: {
        status: 'SUBMITTED',
        updatedAt: new Date()
      }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        projectId,
        action: `Submitted patent form ${form.formType} (Version ${form.version}).`
      }
    });

    return updated;
  }
}
