import { prisma } from '../config/db';
import { Prototype, DrawingFigure, DrawingComponent } from '@prisma/client';

export class PrototypeService {
  /**
   * Create a new Prototype entry for a project.
   */
  static async createPrototype(
    projectId: string,
    data: {
      title: string;
      description?: string;
      status?: string;
      sourceDocumentId?: string;
    },
    userId?: string
  ): Promise<Prototype> {
    if (!data.title || !data.title.trim()) {
      throw new Error('Prototype title is required.');
    }

    const project = await prisma.patentProject.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error('Patent project not found.');
    }

    const prototype = await prisma.prototype.create({
      data: {
        projectId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: data.status || 'DRAFT',
        sourceDocumentId: data.sourceDocumentId || null,
        createdBy: userId || null
      }
    });

    if (userId) {
      try {
        await prisma.activityLog.create({
          data: {
            userId,
            projectId,
            action: `Created prototype record: "${data.title.trim()}".`
          }
        });
      } catch (e) {
        // Ignore activity log creation in mock/test environments
      }
    }

    return prototype;
  }

  /**
   * Get all Prototypes for a project.
   */
  static async getProjectPrototypes(projectId: string): Promise<Prototype[]> {
    return prisma.prototype.findMany({
      where: { projectId },
      include: {
        figures: {
          include: {
            components: true,
            sourceDocument: true,
            generatedDocument: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a single Prototype by ID.
   */
  static async getPrototypeById(projectId: string, prototypeId: string): Promise<Prototype> {
    const prototype = await prisma.prototype.findUnique({
      where: { id: prototypeId },
      include: {
        figures: {
          include: {
            components: true,
            sourceDocument: true,
            generatedDocument: true
          }
        }
      }
    });

    if (!prototype || prototype.projectId !== projectId) {
      throw new Error('Prototype record not found or project isolation violation.');
    }

    return prototype;
  }

  /**
   * Update a Prototype entry.
   */
  static async updatePrototype(
    projectId: string,
    prototypeId: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
    }
  ): Promise<Prototype> {
    const existing = await this.getPrototypeById(projectId, prototypeId);

    return prisma.prototype.update({
      where: { id: existing.id },
      data: {
        title: data.title ? data.title.trim() : existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        status: data.status || existing.status,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Delete a Prototype entry.
   */
  static async deletePrototype(projectId: string, prototypeId: string): Promise<void> {
    const existing = await this.getPrototypeById(projectId, prototypeId);

    await prisma.prototype.delete({
      where: { id: existing.id }
    });
  }

  /**
   * Create a new DrawingFigure for a project.
   */
  static async createDrawingFigure(
    projectId: string,
    data: {
      prototypeId?: string;
      figureNumber?: string;
      title: string;
      description?: string;
      sourceDocumentId?: string;
    }
  ): Promise<DrawingFigure> {
    if (!data.title || !data.title.trim()) {
      throw new Error('Drawing figure title is required.');
    }

    // Determine figure number (e.g. FIG. 1, FIG. 2)
    let figNum = data.figureNumber?.trim();
    if (!figNum) {
      const existingFiguresCount = await prisma.drawingFigure.count({
        where: { projectId }
      });
      figNum = `FIG. ${existingFiguresCount + 1}`;
    }

    // Check duplicate figure number for project
    const duplicate = await prisma.drawingFigure.findUnique({
      where: {
        projectId_figureNumber: {
          projectId,
          figureNumber: figNum
        }
      }
    });

    if (duplicate) {
      const existingFiguresCount = await prisma.drawingFigure.count({
        where: { projectId }
      });
      figNum = `FIG. ${existingFiguresCount + 1}`;
    }

    return prisma.drawingFigure.create({
      data: {
        projectId,
        prototypeId: data.prototypeId || null,
        figureNumber: figNum,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        sourceDocumentId: data.sourceDocumentId || null
      },
      include: {
        components: true,
        sourceDocument: true,
        generatedDocument: true
      }
    });
  }

  /**
   * Get all DrawingFigures for a project.
   */
  static async getProjectFigures(projectId: string): Promise<DrawingFigure[]> {
    return prisma.drawingFigure.findMany({
      where: { projectId },
      include: {
        components: { orderBy: { referenceNumber: 'asc' } },
        sourceDocument: true,
        generatedDocument: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Get a single DrawingFigure by ID.
   */
  static async getFigureById(projectId: string, figureId: string): Promise<DrawingFigure> {
    const figure = await prisma.drawingFigure.findUnique({
      where: { id: figureId },
      include: {
        components: { orderBy: { referenceNumber: 'asc' } },
        sourceDocument: true,
        generatedDocument: true
      }
    });

    if (!figure || figure.projectId !== projectId) {
      throw new Error('Drawing figure record not found or project isolation violation.');
    }

    return figure;
  }

  /**
   * Update DrawingFigure metadata.
   */
  static async updateDrawingFigure(
    projectId: string,
    figureId: string,
    data: {
      figureNumber?: string;
      title?: string;
      description?: string;
      analysisStatus?: string;
      confidence?: number;
      disclaimer?: string;
      generatedDocumentId?: string;
    }
  ): Promise<DrawingFigure> {
    const figure = await this.getFigureById(projectId, figureId);

    return prisma.drawingFigure.update({
      where: { id: figure.id },
      data: {
        figureNumber: data.figureNumber ? data.figureNumber.trim() : figure.figureNumber,
        title: data.title ? data.title.trim() : figure.title,
        description: data.description !== undefined ? data.description : figure.description,
        analysisStatus: data.analysisStatus || figure.analysisStatus,
        confidence: data.confidence !== undefined ? data.confidence : figure.confidence,
        disclaimer: data.disclaimer !== undefined ? data.disclaimer : figure.disclaimer,
        generatedDocumentId: data.generatedDocumentId || figure.generatedDocumentId,
        updatedAt: new Date()
      },
      include: {
        components: { orderBy: { referenceNumber: 'asc' } },
        sourceDocument: true,
        generatedDocument: true
      }
    });
  }

  /**
   * Delete a DrawingFigure.
   */
  static async deleteDrawingFigure(projectId: string, figureId: string): Promise<void> {
    const figure = await this.getFigureById(projectId, figureId);

    await prisma.drawingFigure.delete({
      where: { id: figure.id }
    });
  }

  /**
   * Update/Replace DrawingComponent tags for a figure.
   */
  static async updateFigureComponents(
    projectId: string,
    figureId: string,
    components: Array<{
      referenceNumber: string;
      componentName: string;
      description?: string;
      xRatio?: number;
      yRatio?: number;
    }>
  ): Promise<DrawingComponent[]> {
    const figure = await this.getFigureById(projectId, figureId);

    // Delete existing components for this figure
    await prisma.drawingComponent.deleteMany({
      where: { figureId: figure.id }
    });

    if (!components || components.length === 0) {
      return [];
    }

    // Create new component tags
    const created = await Promise.all(
      components.map((c) =>
        prisma.drawingComponent.create({
          data: {
            figureId: figure.id,
            referenceNumber: String(c.referenceNumber || '100').trim(),
            componentName: String(c.componentName || 'Component').trim(),
            description: c.description?.trim() || null,
            xRatio: typeof c.xRatio === 'number' ? c.xRatio : null,
            yRatio: typeof c.yRatio === 'number' ? c.yRatio : null
          }
        })
      )
    );

    return created;
  }
}
