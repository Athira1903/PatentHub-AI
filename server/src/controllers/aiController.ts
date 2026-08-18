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

    const references = await prisma.patentReference.findMany({
      where: { projectId }
    });

    const analysis = await AiService.analyzeSimilarity(
      project.title,
      project.category || '',
      project.technicalDomain || '',
      project.innovationIdea,
      project.proposedSolution,
      references
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

    const references = await prisma.patentReference.findMany({
      where: { projectId }
    });

    const assessment = await AiService.analyzeNovelty(
      project.title,
      project.category || '',
      project.technicalDomain || '',
      project.innovationIdea,
      project.proposedSolution,
      references
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

export const chatProjectAssistant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ message: 'Message is required.' });
      return;
    }

    const project: any = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: {
        patentClaims: {
          orderBy: { orderIndex: 'asc' }
        },
        patentReferences: true,
        documents: {
          select: { name: true, category: true }
        },
        projectReviews: {
          select: { decision: true, comments: true, reviewer: { select: { fullName: true } } }
        }
      }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found.' });
      return;
    }

    // Compute filing readiness
    const stageIndexMap: Record<string, number> = {
      IDEA: 0,
      LITERATURE_REVIEW: 1,
      DOCUMENTATION: 2,
      GUIDE_REVIEW: 3,
      PATENT_EXPERT_REVIEW: 3,
      PROTOTYPE: 4,
      FORMS_PREPARATION: 4,
      FILING_READY: 5,
      FILED: 5
    };
    const currentStageIdx = stageIndexMap[project.stage] ?? 0;
    const filingReadiness = Math.round(((currentStageIdx + 1) / 6) * 100);

    const projectContext = {
      title: project.title,
      category: project.category || undefined,
      technicalDomain: project.technicalDomain || undefined,
      stage: project.stage,
      innovationIdea: project.innovationIdea,
      proposedSolution: project.proposedSolution,
      novelFeatures: project.novelFeatures || undefined,
      claims: (project.patentClaims || []).map((c: any) => ({
        claimNumber: c.claimNumber,
        claimType: c.claimType,
        preamble: c.preamble || undefined,
        body: c.body
      })),
      priorArtReferences: (project.patentReferences || []).map((r: any) => ({
        patentNumber: r.patentNumber,
        title: r.title,
        abstract: r.abstract || undefined
      })),
      filingReadiness,
      reviews: (project.projectReviews || []).map((r: any) => ({
        reviewerName: r.reviewer?.fullName,
        comments: r.comments || undefined,
        status: r.decision
      })),
      documents: (project.documents || []).map((d: any) => ({
        name: d.name,
        category: d.category || undefined
      }))
    };

    const aiResult = await AiService.chatWithProjectAssistant(projectContext, message.trim(), history || []);

    res.status(200).json({
      success: true,
      ...aiResult
    });
  } catch (error: any) {
    console.error('chatProjectAssistant Error:', error);
    const userMessage = error.message?.includes('API Key')
      ? 'AI service is temporarily unavailable: Gemini API key not configured.'
      : error.message || 'Google Gemini AI assistant is currently unavailable.';
    res.status(502).json({ message: userMessage });
  }
};
