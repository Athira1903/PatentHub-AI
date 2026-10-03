import { Request, Response } from 'express';
import { NextActionService } from '../services/nextActionService';
import { FilingIssueService } from '../services/filingIssueService';
import { DeadlineService } from '../services/deadlineService';
import { PatentClassificationService } from '../services/patentClassificationService';
import { SpecificationService } from '../services/specificationService';
import { AIProviderService } from '../services/aiProviderService';
import { prisma } from '../config/db';

export const getNextAction = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = (req as any).user;
    const nextAction = await NextActionService.determineNextAction(id, user);
    res.json(nextAction);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to determine next action' });
  }
};

export const getUserPrimaryNextAction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const result = await NextActionService.getUserPrimaryNextAction(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to determine primary next action' });
  }
};

export const getFilingAssessment = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const assessment = await FilingIssueService.assessFilingReadiness(id);
    res.json(assessment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to assess filing readiness' });
  }
};

export const getDeadlines = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const deadlines = await DeadlineService.syncProjectDeadlines(id);
    res.json(deadlines);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch deadlines' });
  }
};

export const recordFilingEvent = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { eventType, filingDate, applicationNumber, cbrNumber, description } = req.body;
    const event = await DeadlineService.recordFilingEvent(id, {
      eventType,
      filingDate: filingDate ? new Date(filingDate) : undefined,
      applicationNumber,
      cbrNumber,
      description,
      createdBy: (req as any).user?.id,
    });
    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record filing event' });
  }
};

export const suggestClassification = async (req: Request, res: Response) => {
  try {
    const { title, description, projectId } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required for classification analysis' });
    }
    const result = await PatentClassificationService.suggestClassification(
      title,
      description,
      projectId ? String(projectId) : undefined,
      (req as any).user?.id
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to analyze classification' });
  }
};

export const getSpecification = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const spec = await SpecificationService.getSpecification(id);
    res.json(spec);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch specification' });
  }
};

export const saveSpecification = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const updated = await SpecificationService.saveSpecification(id, req.body, userId);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save specification' });
  }
};

export const restoreSpecificationVersion = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const versionId = String(req.params.versionId);
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const restored = await SpecificationService.restoreVersion(id, versionId, userId);
    res.json(restored);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to restore specification version' });
  }
};

export const exportSpecificationPdf = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await SpecificationService.exportPdf(id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to export specification PDF' });
  }
};

export const getApplicants = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const applicants = await prisma.applicant.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(applicants);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addApplicant = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, applicantType, address, country, nationality, email, phone, isPrimary } = req.body;
    const applicant = await prisma.applicant.create({
      data: {
        projectId: id,
        name,
        applicantType: applicantType || 'INDIVIDUAL',
        address,
        country: country || 'India',
        nationality: nationality || 'Indian',
        email,
        phone,
        isPrimary: Boolean(isPrimary),
      },
    });
    res.status(201).json(applicant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteApplicant = async (req: Request, res: Response) => {
  try {
    const applicantId = String(req.params.applicantId);
    await prisma.applicant.delete({ where: { id: applicantId } });
    res.json({ success: true, message: 'Applicant removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInventors = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const inventors = await prisma.inventor.findMany({
      where: { projectId: id },
      orderBy: { orderIndex: 'asc' },
    });
    res.json(inventors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addInventor = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, address, country, nationality, email, phone, contribution, inventorshipDeclarationSigned, isPrimary } = req.body;
    const count = await prisma.inventor.count({ where: { projectId: id } });
    const inventor = await prisma.inventor.create({
      data: {
        projectId: id,
        name,
        address,
        country: country || 'India',
        nationality: nationality || 'Indian',
        email,
        phone,
        contribution,
        inventorshipDeclarationSigned: Boolean(inventorshipDeclarationSigned),
        isPrimary: Boolean(isPrimary),
        orderIndex: count,
      },
    });
    res.status(201).json(inventor);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteInventor = async (req: Request, res: Response) => {
  try {
    const inventorId = String(req.params.inventorId);
    await prisma.inventor.delete({ where: { id: inventorId } });
    res.json({ success: true, message: 'Inventor removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const runInnovationAnalysis = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const project = await prisma.patentProject.findUnique({
      where: { id },
      include: { patentReferences: true },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const priorArtAbstracts = (project.patentReferences || []).map((r: any) => r.abstract || '').filter(Boolean);
    const result = await AIProviderService.analyzeInnovation(
      id,
      (req as any).user?.id,
      project.title,
      project.problemStatement,
      project.proposedSolution,
      priorArtAbstracts
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const runClaimSuggestion = async (req: Request, res: Response) => {
  try {
    const { preamble, body } = req.body;
    if (!preamble || !body) {
      return res.status(400).json({ error: 'Claim preamble and body are required' });
    }
    const suggestion = AIProviderService.suggestClaimReview(preamble, body);
    res.json(suggestion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const searchIPC = async (req: Request, res: Response) => {
  try {
    const query = ((req.query.q as string) || '').trim().toLowerCase();
    const domain = (req.query.domain as string) || '';

    const where: any = {};
    if (domain) {
      where.domain = { contains: domain, mode: 'insensitive' };
    }

    const all = await prisma.iPCClassification.findMany({ where, take: 50 });
    if (!query) return res.json(all);

    const filtered = all.filter(
      (ipc) =>
        ipc.fullSymbol.toLowerCase().includes(query) ||
        ipc.title.toLowerCase().includes(query) ||
        (ipc.description && ipc.description.toLowerCase().includes(query)) ||
        (ipc.keywords && ipc.keywords.toLowerCase().includes(query))
    );
    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
