import { prisma } from '../config/db';
import { PatentReference } from '@prisma/client';

export class PatentReferenceService {
  /**
   * Save a patent reference to a project.
   */
  static async saveReference(
    projectId: string,
    data: {
      patentNumber: string;
      title: string;
      abstract?: string | null;
      claims?: string | null;
      url?: string | null;
      inventors?: string | null;
      assignee?: string | null;
      publishDate?: string | null;
      source: string;
    }
  ): Promise<PatentReference> {
    // 1. Validate malformed data
    if (!data.patentNumber || !data.title) {
      throw new Error('Patent number and title are required fields.');
    }

    // 2. Prevent duplicate saved references for the same project
    const existing = await prisma.patentReference.findUnique({
      where: {
        projectId_patentNumber: {
          projectId,
          patentNumber: data.patentNumber
        }
      }
    });

    if (existing) {
      throw new Error('This patent is already saved as a reference for this project.');
    }

    // 3. Store reference
    return prisma.patentReference.create({
      data: {
        projectId,
        patentNumber: data.patentNumber,
        title: data.title,
        abstract: data.abstract || null,
        claims: data.claims || null,
        url: data.url || null,
        inventors: data.inventors || null,
        assignee: data.assignee || null,
        publishDate: data.publishDate ? new Date(data.publishDate) : null,
        source: data.source || 'USPTO'
      }
    });
  }

  /**
   * List all saved patent references for a project.
   */
  static async listReferences(projectId: string): Promise<PatentReference[]> {
    return prisma.patentReference.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Delete a saved reference.
   */
  static async deleteReference(projectId: string, referenceId: string): Promise<PatentReference> {
    const reference = await prisma.patentReference.findUnique({
      where: { id: referenceId }
    });

    if (!reference) {
      throw new Error('Patent reference not found.');
    }

    // Enforce project isolation: verify the reference belongs to the requested project
    if (reference.projectId !== projectId) {
      throw new Error('Project isolation violation: Reference does not belong to this project.');
    }

    return prisma.patentReference.delete({
      where: { id: referenceId }
    });
  }
}
