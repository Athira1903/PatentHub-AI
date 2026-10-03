import { Request, Response } from 'express';
import { SpecificationService } from '../services/specificationService';

export class SpecificationController {
  static async getSpecification(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id || req.params.projectId);
      const spec = await SpecificationService.getSpecification(projectId);
      res.json(spec);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch specification' });
    }
  }

  static async updateSpecification(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id || req.params.projectId);
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const updated = await SpecificationService.saveSpecification(projectId, req.body, userId);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update specification' });
    }
  }

  static async createVersion(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id || req.params.projectId);
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const { changeSummary } = req.body;
      const result = await SpecificationService.createVersion(projectId, changeSummary, userId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create specification version snapshot' });
    }
  }

  static async getVersions(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id || req.params.projectId);
      const versions = await SpecificationService.getVersions(projectId);
      res.json(versions);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch specification versions' });
    }
  }

  static async getVersionById(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id || req.params.projectId);
      const versionId = String(req.params.versionId);
      const version = await SpecificationService.getVersion(projectId, versionId);
      res.json(version);
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Specification version not found' });
    }
  }

  static async restoreVersion(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id || req.params.projectId);
      const versionId = String(req.params.versionId);
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const restored = await SpecificationService.restoreVersion(projectId, versionId, userId);
      res.json(restored);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to restore specification version' });
    }
  }

  static async compareVersions(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id || req.params.projectId);
      const versionA = String(req.params.versionA);
      const versionB = String(req.params.versionB);
      const diff = await SpecificationService.compareVersions(projectId, versionA, versionB);
      res.json(diff);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to compare specification versions' });
    }
  }

  static async syncWithForm2(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id || req.params.projectId);
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const result = await SpecificationService.syncWithForm2(projectId, userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to synchronize with Form 2' });
    }
  }

  static async exportPdf(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id || req.params.projectId);
      const result = await SpecificationService.exportPdf(projectId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to export specification PDF' });
    }
  }
}
