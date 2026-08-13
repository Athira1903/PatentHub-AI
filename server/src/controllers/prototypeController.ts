import { Response } from 'express';
import { ProjectRequest } from '../policies/middleware/policyGuard';
import { PrototypeService } from '../services/prototypeService';
import { AiService } from '../services/aiService';
import { PdfService } from '../services/pdfService';
import { prisma } from '../config/db';
import fs from 'fs';
import path from 'path';

export const getPrototypes = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const prototypes = await PrototypeService.getProjectPrototypes(projectId);
    res.status(200).json({ success: true, prototypes });
  } catch (error: any) {
    console.error('getPrototypes Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch prototypes.' });
  }
};

export const createPrototype = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const { title, description, status, sourceDocumentId } = req.body;

    const prototype = await PrototypeService.createPrototype(
      projectId,
      { title, description, status, sourceDocumentId },
      req.user?.userId
    );

    res.status(201).json({ success: true, prototype });
  } catch (error: any) {
    console.error('createPrototype Error:', error);
    res.status(400).json({ message: error.message || 'Failed to create prototype.' });
  }
};

export const getPrototypeById = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const prototypeId = req.params.prototypeId as string;

    const prototype = await PrototypeService.getPrototypeById(projectId, prototypeId);
    res.status(200).json({ success: true, prototype });
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Prototype not found.' });
  }
};

export const updatePrototype = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const prototypeId = req.params.prototypeId as string;
    const { title, description, status } = req.body;

    const updated = await PrototypeService.updatePrototype(projectId, prototypeId, { title, description, status });
    res.status(200).json({ success: true, prototype: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update prototype.' });
  }
};

export const deletePrototype = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const prototypeId = req.params.prototypeId as string;

    await PrototypeService.deletePrototype(projectId, prototypeId);
    res.status(200).json({ success: true, message: 'Prototype deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete prototype.' });
  }
};

export const getFigures = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const figures = await PrototypeService.getProjectFigures(projectId);
    res.status(200).json({ success: true, figures });
  } catch (error: any) {
    console.error('getFigures Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch drawing figures.' });
  }
};

export const createFigure = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const { prototypeId, figureNumber, title, description, sourceDocumentId } = req.body;

    const figure = await PrototypeService.createDrawingFigure(projectId, {
      prototypeId,
      figureNumber,
      title,
      description,
      sourceDocumentId
    });

    res.status(201).json({ success: true, figure });
  } catch (error: any) {
    console.error('createFigure Error:', error);
    res.status(400).json({ message: error.message || 'Failed to create drawing figure.' });
  }
};

export const updateFigure = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const figureId = req.params.figureId as string;
    const { figureNumber, title, description, analysisStatus, confidence, disclaimer } = req.body;

    const updated = await PrototypeService.updateDrawingFigure(projectId, figureId, {
      figureNumber,
      title,
      description,
      analysisStatus,
      confidence,
      disclaimer
    });

    res.status(200).json({ success: true, figure: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update drawing figure.' });
  }
};

export const deleteFigure = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const figureId = req.params.figureId as string;

    await PrototypeService.deleteDrawingFigure(projectId, figureId);
    res.status(200).json({ success: true, message: 'Drawing figure deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete drawing figure.' });
  }
};

export const updateFigureComponents = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const figureId = req.params.figureId as string;
    const { components } = req.body;

    if (!Array.isArray(components)) {
      res.status(400).json({ message: 'Components array is required.' });
      return;
    }

    const updatedComponents = await PrototypeService.updateFigureComponents(projectId, figureId, components);
    res.status(200).json({ success: true, components: updatedComponents });
  } catch (error: any) {
    console.error('updateFigureComponents Error:', error);
    res.status(400).json({ message: error.message || 'Failed to update figure components.' });
  }
};

export const analyzeFigureImageVision = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const figureId = req.params.figureId as string;

    const figure = await PrototypeService.getFigureById(projectId, figureId);
    const project = req.project;

    if (!project || !project.title || !project.innovationIdea || !project.proposedSolution) {
      res.status(400).json({ message: 'Project title, innovation idea, and proposed solution are required for Gemini Vision analysis.' });
      return;
    }

    // Locate source document image
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/png';

    if (figure.sourceDocumentId) {
      const doc = await prisma.document.findUnique({ where: { id: figure.sourceDocumentId } });
      if (doc && doc.fileUrl) {
        const relativePath = doc.fileUrl.replace('/uploads/documents/', '');
        const physicalPath = path.join(__dirname, '../../public/uploads/documents', relativePath);
        if (fs.existsSync(physicalPath)) {
          imageBuffer = fs.readFileSync(physicalPath);
          mimeType = doc.fileType || 'image/png';
        }
      }
    }

    if (!imageBuffer) {
      // Create lightweight placeholder drawing buffer for analysis
      const placeholderSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="16">Technical Blueprint View - ${figure.figureNumber}</text></svg>`;
      imageBuffer = Buffer.from(placeholderSvg);
      mimeType = 'image/svg+xml';
    }

    const visionResult = await AiService.analyzePrototypeImageVision(imageBuffer, mimeType, {
      title: project.title,
      innovationIdea: project.innovationIdea,
      proposedSolution: project.proposedSolution
    });

    // Persist components to database
    const savedComponents = await PrototypeService.updateFigureComponents(
      projectId,
      figure.id,
      visionResult.components.map((c) => ({
        referenceNumber: c.referenceNumber,
        componentName: c.name,
        description: c.description
      }))
    );

    // Update DrawingFigure analysis status & confidence
    const updatedFigure = await PrototypeService.updateDrawingFigure(projectId, figure.id, {
      description: visionResult.figureDescription,
      analysisStatus: 'ANALYZED',
      confidence: visionResult.confidence,
      disclaimer: visionResult.disclaimer
    });

    res.status(200).json({
      success: true,
      figure: updatedFigure,
      components: savedComponents,
      confidence: visionResult.confidence,
      disclaimer: visionResult.disclaimer
    });
  } catch (error: any) {
    console.error('analyzeFigureImageVision Error:', error);
    res.status(502).json({ message: error.message || 'Google Gemini Vision analysis is currently unavailable.' });
  }
};

export const generateFigureSheetPdf = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const figureId = req.params.figureId as string;

    const document = await PdfService.generatePatentFigureSheetPdf(projectId, figureId, req.user?.userId);
    res.status(201).json({ success: true, message: 'Technical figure sheet PDF generated successfully.', document });
  } catch (error: any) {
    console.error('generateFigureSheetPdf Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate figure sheet PDF.' });
  }
};
