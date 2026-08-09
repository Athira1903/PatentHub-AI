import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { prisma } from '../config/db';
import { AiService } from '../services/aiService';

export const generateInnovationAi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { action } = req.body;
    const projectId = req.params.id as string;

    if (!action || !['title', 'abstract', 'description', 'keywords', 'claims'].includes(action)) {
      res.status(400).json({ message: 'Invalid or missing action in request body.' });
      return;
    }

    const project = await prisma.patentProject.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found.' });
      return;
    }

    if (!project.title || !project.innovationIdea || !project.proposedSolution) {
      res.status(400).json({ message: 'Project must have a title, innovation idea, and proposed solution configured to generate draft ideas.' });
      return;
    }

    const suggestion = await AiService.generateInnovationSuggestions(
      project.title,
      project.category || '',
      project.technicalDomain || '',
      project.innovationIdea,
      project.proposedSolution,
      action
    );

    res.status(200).json({
      success: true,
      action,
      suggestion,
    });
  } catch (error: any) {
    console.error('generateInnovationAi Error:', error);
    res.status(502).json({ message: 'Google Gemini AI drafting assistant is currently unavailable.' });
  }
};

export const getSimilarityAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;

    const project = await prisma.patentProject.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found.' });
      return;
    }

    if (!project.title || !project.innovationIdea || !project.proposedSolution) {
      res.status(400).json({ message: 'Project must have a title, innovation idea, and proposed solution configured to run AI diagnostics.' });
      return;
    }

    const analysis = await AiService.analyzeSimilarity(
      project.title,
      project.category || '',
      project.technicalDomain || '',
      project.innovationIdea,
      project.proposedSolution
    );

    res.status(200).json({
      success: true,
      ...analysis
    });
  } catch (error: any) {
    console.error('getSimilarityAnalysis Error:', error);
    res.status(502).json({ message: 'Google Gemini AI similarity analysis is currently unavailable.' });
  }
};

export const getNoveltyAssessment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;

    const project = await prisma.patentProject.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found.' });
      return;
    }

    if (!project.title || !project.innovationIdea || !project.proposedSolution) {
      res.status(400).json({ message: 'Project must have a title, innovation idea, and proposed solution configured to run AI diagnostics.' });
      return;
    }

    const assessment = await AiService.analyzeNovelty(
      project.title,
      project.category || '',
      project.technicalDomain || '',
      project.innovationIdea,
      project.proposedSolution
    );

    res.status(200).json({
      success: true,
      ...assessment
    });
  } catch (error: any) {
    console.error('getNoveltyAssessment Error:', error);
    res.status(502).json({ message: 'Google Gemini AI novelty assessment is currently unavailable.' });
  }
};

export const generatePatentDrawing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const { originalName, originalUrl } = req.body;

    const project = await prisma.patentProject.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found.' });
      return;
    }

    if (!project.title || !project.innovationIdea || !project.proposedSolution) {
      res.status(400).json({ message: 'Project must have a title, innovation idea, and proposed solution configured to run AI diagnostics.' });
      return;
    }

    const drawingData = await AiService.generatePatentDrawingAnalysis(
      project.title,
      project.innovationIdea,
      project.proposedSolution
    );

    res.status(200).json({
      success: true,
      version: `V${Math.floor(Math.random() * 3) + 1}`,
      originalImage: originalUrl || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
      patentDrawing: originalUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=400',
      drawingMetadata: {
        figNum: drawingData.figNum,
        components: drawingData.components,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('generatePatentDrawing Error:', error);
    res.status(502).json({ message: 'Google Gemini AI drawing assistant is currently unavailable.' });
  }
};
