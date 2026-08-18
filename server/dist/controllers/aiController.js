"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatProjectAssistant = exports.generatePatentDrawing = exports.getNoveltyAssessment = exports.getSimilarityAnalysis = exports.generateInnovationAi = void 0;
const db_1 = require("../config/db");
const aiService_1 = require("../services/aiService");
const generateInnovationAi = async (req, res) => {
    try {
        const { action } = req.body;
        const projectId = req.params.id;
        if (!action || !['title', 'abstract', 'description', 'keywords', 'claims'].includes(action)) {
            res.status(400).json({ message: 'Invalid or missing action in request body.' });
            return;
        }
        const project = await db_1.prisma.patentProject.findUnique({
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
        const suggestion = await aiService_1.AiService.generateInnovationSuggestions(project.title, project.category || '', project.technicalDomain || '', project.innovationIdea, project.proposedSolution, action);
        res.status(200).json({
            success: true,
            action,
            suggestion,
        });
    }
    catch (error) {
        console.error('generateInnovationAi Error:', error);
        res.status(502).json({ message: 'Google Gemini AI drafting assistant is currently unavailable.' });
    }
};
exports.generateInnovationAi = generateInnovationAi;
const getSimilarityAnalysis = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await db_1.prisma.patentProject.findUnique({
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
        const references = await db_1.prisma.patentReference.findMany({
            where: { projectId }
        });
        const analysis = await aiService_1.AiService.analyzeSimilarity(project.title, project.category || '', project.technicalDomain || '', project.innovationIdea, project.proposedSolution, references);
        res.status(200).json({
            success: true,
            ...analysis
        });
    }
    catch (error) {
        console.error('getSimilarityAnalysis Error:', error);
        res.status(502).json({ message: 'Google Gemini AI similarity analysis is currently unavailable.' });
    }
};
exports.getSimilarityAnalysis = getSimilarityAnalysis;
const getNoveltyAssessment = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await db_1.prisma.patentProject.findUnique({
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
        const references = await db_1.prisma.patentReference.findMany({
            where: { projectId }
        });
        const assessment = await aiService_1.AiService.analyzeNovelty(project.title, project.category || '', project.technicalDomain || '', project.innovationIdea, project.proposedSolution, references);
        res.status(200).json({
            success: true,
            ...assessment
        });
    }
    catch (error) {
        console.error('getNoveltyAssessment Error:', error);
        res.status(502).json({ message: 'Google Gemini AI novelty assessment is currently unavailable.' });
    }
};
exports.getNoveltyAssessment = getNoveltyAssessment;
const generatePatentDrawing = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { originalName, originalUrl } = req.body;
        const project = await db_1.prisma.patentProject.findUnique({
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
        const drawingData = await aiService_1.AiService.generatePatentDrawingAnalysis(project.title, project.innovationIdea, project.proposedSolution);
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
    }
    catch (error) {
        console.error('generatePatentDrawing Error:', error);
        res.status(502).json({ message: 'Google Gemini AI drawing assistant is currently unavailable.' });
    }
};
exports.generatePatentDrawing = generatePatentDrawing;
const chatProjectAssistant = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { message, history } = req.body;
        if (!message || !message.trim()) {
            res.status(400).json({ message: 'Message is required.' });
            return;
        }
        const project = await db_1.prisma.patentProject.findUnique({
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
        const stageIndexMap = {
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
            claims: (project.patentClaims || []).map((c) => ({
                claimNumber: c.claimNumber,
                claimType: c.claimType,
                preamble: c.preamble || undefined,
                body: c.body
            })),
            priorArtReferences: (project.patentReferences || []).map((r) => ({
                patentNumber: r.patentNumber,
                title: r.title,
                abstract: r.abstract || undefined
            })),
            filingReadiness,
            reviews: (project.projectReviews || []).map((r) => ({
                reviewerName: r.reviewer?.fullName,
                comments: r.comments || undefined,
                status: r.decision
            })),
            documents: (project.documents || []).map((d) => ({
                name: d.name,
                category: d.category || undefined
            }))
        };
        const aiResult = await aiService_1.AiService.chatWithProjectAssistant(projectContext, message.trim(), history || []);
        res.status(200).json({
            success: true,
            ...aiResult
        });
    }
    catch (error) {
        console.error('chatProjectAssistant Error:', error);
        const userMessage = error.message?.includes('API Key')
            ? 'AI service is temporarily unavailable: Gemini API key not configured.'
            : error.message || 'Google Gemini AI assistant is currently unavailable.';
        res.status(502).json({ message: userMessage });
    }
};
exports.chatProjectAssistant = chatProjectAssistant;
