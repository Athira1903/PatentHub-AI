"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrototypeService = void 0;
const db_1 = require("../config/db");
class PrototypeService {
    /**
     * Create a new Prototype entry for a project.
     */
    static async createPrototype(projectId, data, userId) {
        if (!data.title || !data.title.trim()) {
            throw new Error('Prototype title is required.');
        }
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId }
        });
        if (!project) {
            throw new Error('Patent project not found.');
        }
        const prototype = await db_1.prisma.prototype.create({
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
                await db_1.prisma.activityLog.create({
                    data: {
                        userId,
                        projectId,
                        action: `Created prototype record: "${data.title.trim()}".`
                    }
                });
            }
            catch (e) {
                // Ignore activity log creation in mock/test environments
            }
        }
        return prototype;
    }
    /**
     * Get all Prototypes for a project.
     */
    static async getProjectPrototypes(projectId) {
        return db_1.prisma.prototype.findMany({
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
    static async getPrototypeById(projectId, prototypeId) {
        const prototype = await db_1.prisma.prototype.findUnique({
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
    static async updatePrototype(projectId, prototypeId, data) {
        const existing = await this.getPrototypeById(projectId, prototypeId);
        return db_1.prisma.prototype.update({
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
    static async deletePrototype(projectId, prototypeId) {
        const existing = await this.getPrototypeById(projectId, prototypeId);
        await db_1.prisma.prototype.delete({
            where: { id: existing.id }
        });
    }
    /**
     * Create a new DrawingFigure for a project.
     */
    static async createDrawingFigure(projectId, data) {
        if (!data.title || !data.title.trim()) {
            throw new Error('Drawing figure title is required.');
        }
        // Determine figure number (e.g. FIG. 1, FIG. 2)
        let figNum = data.figureNumber?.trim();
        if (!figNum) {
            const existingFiguresCount = await db_1.prisma.drawingFigure.count({
                where: { projectId }
            });
            figNum = `FIG. ${existingFiguresCount + 1}`;
        }
        // Check duplicate figure number for project
        const duplicate = await db_1.prisma.drawingFigure.findUnique({
            where: {
                projectId_figureNumber: {
                    projectId,
                    figureNumber: figNum
                }
            }
        });
        if (duplicate) {
            const existingFiguresCount = await db_1.prisma.drawingFigure.count({
                where: { projectId }
            });
            figNum = `FIG. ${existingFiguresCount + 1}`;
        }
        return db_1.prisma.drawingFigure.create({
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
    static async getProjectFigures(projectId) {
        return db_1.prisma.drawingFigure.findMany({
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
    static async getFigureById(projectId, figureId) {
        const figure = await db_1.prisma.drawingFigure.findUnique({
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
    static async updateDrawingFigure(projectId, figureId, data) {
        const figure = await this.getFigureById(projectId, figureId);
        return db_1.prisma.drawingFigure.update({
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
    static async deleteDrawingFigure(projectId, figureId) {
        const figure = await this.getFigureById(projectId, figureId);
        await db_1.prisma.drawingFigure.delete({
            where: { id: figure.id }
        });
    }
    /**
     * Update/Replace DrawingComponent tags for a figure.
     */
    static async updateFigureComponents(projectId, figureId, components) {
        const figure = await this.getFigureById(projectId, figureId);
        // Delete existing components for this figure
        await db_1.prisma.drawingComponent.deleteMany({
            where: { figureId: figure.id }
        });
        if (!components || components.length === 0) {
            return [];
        }
        // Create new component tags
        const created = await Promise.all(components.map((c) => db_1.prisma.drawingComponent.create({
            data: {
                figureId: figure.id,
                referenceNumber: String(c.referenceNumber || '100').trim(),
                componentName: String(c.componentName || 'Component').trim(),
                description: c.description?.trim() || null,
                xRatio: typeof c.xRatio === 'number' ? c.xRatio : null,
                yRatio: typeof c.yRatio === 'number' ? c.yRatio : null
            }
        })));
        return created;
    }
}
exports.PrototypeService = PrototypeService;
