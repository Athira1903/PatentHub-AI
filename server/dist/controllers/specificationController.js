"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecificationController = void 0;
const specificationService_1 = require("../services/specificationService");
class SpecificationController {
    static async getSpecification(req, res) {
        try {
            const projectId = String(req.params.id || req.params.projectId);
            const spec = await specificationService_1.SpecificationService.getSpecification(projectId);
            res.json(spec);
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to fetch specification' });
        }
    }
    static async updateSpecification(req, res) {
        try {
            const projectId = String(req.params.id || req.params.projectId);
            const userId = req.user?.userId || req.user?.id;
            const updated = await specificationService_1.SpecificationService.saveSpecification(projectId, req.body, userId);
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to update specification' });
        }
    }
    static async createVersion(req, res) {
        try {
            const projectId = String(req.params.id || req.params.projectId);
            const userId = req.user?.userId || req.user?.id;
            const { changeSummary } = req.body;
            const result = await specificationService_1.SpecificationService.createVersion(projectId, changeSummary, userId);
            res.status(201).json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to create specification version snapshot' });
        }
    }
    static async getVersions(req, res) {
        try {
            const projectId = String(req.params.id || req.params.projectId);
            const versions = await specificationService_1.SpecificationService.getVersions(projectId);
            res.json(versions);
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to fetch specification versions' });
        }
    }
    static async getVersionById(req, res) {
        try {
            const projectId = String(req.params.id || req.params.projectId);
            const versionId = String(req.params.versionId);
            const version = await specificationService_1.SpecificationService.getVersion(projectId, versionId);
            res.json(version);
        }
        catch (error) {
            res.status(404).json({ error: error.message || 'Specification version not found' });
        }
    }
    static async restoreVersion(req, res) {
        try {
            const projectId = String(req.params.id || req.params.projectId);
            const versionId = String(req.params.versionId);
            const userId = req.user?.userId || req.user?.id;
            const restored = await specificationService_1.SpecificationService.restoreVersion(projectId, versionId, userId);
            res.json(restored);
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to restore specification version' });
        }
    }
    static async compareVersions(req, res) {
        try {
            const projectId = String(req.params.id || req.params.projectId);
            const versionA = String(req.params.versionA);
            const versionB = String(req.params.versionB);
            const diff = await specificationService_1.SpecificationService.compareVersions(projectId, versionA, versionB);
            res.json(diff);
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to compare specification versions' });
        }
    }
    static async syncWithForm2(req, res) {
        try {
            const projectId = String(req.params.id || req.params.projectId);
            const userId = req.user?.userId || req.user?.id;
            const result = await specificationService_1.SpecificationService.syncWithForm2(projectId, userId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to synchronize with Form 2' });
        }
    }
    static async exportPdf(req, res) {
        try {
            const projectId = String(req.params.id || req.params.projectId);
            const result = await specificationService_1.SpecificationService.exportPdf(projectId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to export specification PDF' });
        }
    }
}
exports.SpecificationController = SpecificationController;
