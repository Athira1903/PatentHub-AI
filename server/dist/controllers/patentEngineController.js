"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchIPC = exports.runClaimSuggestion = exports.runInnovationAnalysis = exports.deleteInventor = exports.addInventor = exports.getInventors = exports.deleteApplicant = exports.addApplicant = exports.getApplicants = exports.exportSpecificationPdf = exports.restoreSpecificationVersion = exports.saveSpecification = exports.getSpecification = exports.suggestClassification = exports.recordFilingEvent = exports.getDeadlines = exports.getFilingAssessment = exports.getUserPrimaryNextAction = exports.getNextAction = void 0;
const nextActionService_1 = require("../services/nextActionService");
const filingIssueService_1 = require("../services/filingIssueService");
const deadlineService_1 = require("../services/deadlineService");
const patentClassificationService_1 = require("../services/patentClassificationService");
const specificationService_1 = require("../services/specificationService");
const aiProviderService_1 = require("../services/aiProviderService");
const db_1 = require("../config/db");
const getNextAction = async (req, res) => {
    try {
        const id = String(req.params.id);
        const user = req.user;
        const nextAction = await nextActionService_1.NextActionService.determineNextAction(id, user);
        res.json(nextAction);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to determine next action' });
    }
};
exports.getNextAction = getNextAction;
const getUserPrimaryNextAction = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const result = await nextActionService_1.NextActionService.getUserPrimaryNextAction(userId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to determine primary next action' });
    }
};
exports.getUserPrimaryNextAction = getUserPrimaryNextAction;
const getFilingAssessment = async (req, res) => {
    try {
        const id = String(req.params.id);
        const assessment = await filingIssueService_1.FilingIssueService.assessFilingReadiness(id);
        res.json(assessment);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to assess filing readiness' });
    }
};
exports.getFilingAssessment = getFilingAssessment;
const getDeadlines = async (req, res) => {
    try {
        const id = String(req.params.id);
        const deadlines = await deadlineService_1.DeadlineService.syncProjectDeadlines(id);
        res.json(deadlines);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch deadlines' });
    }
};
exports.getDeadlines = getDeadlines;
const recordFilingEvent = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { eventType, filingDate, applicationNumber, cbrNumber, description } = req.body;
        const event = await deadlineService_1.DeadlineService.recordFilingEvent(id, {
            eventType,
            filingDate: filingDate ? new Date(filingDate) : undefined,
            applicationNumber,
            cbrNumber,
            description,
            createdBy: req.user?.id,
        });
        res.status(201).json(event);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to record filing event' });
    }
};
exports.recordFilingEvent = recordFilingEvent;
const suggestClassification = async (req, res) => {
    try {
        const { title, description, projectId } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required for classification analysis' });
        }
        const result = await patentClassificationService_1.PatentClassificationService.suggestClassification(title, description, projectId ? String(projectId) : undefined, req.user?.id);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to analyze classification' });
    }
};
exports.suggestClassification = suggestClassification;
const getSpecification = async (req, res) => {
    try {
        const id = String(req.params.id);
        const spec = await specificationService_1.SpecificationService.getSpecification(id);
        res.json(spec);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch specification' });
    }
};
exports.getSpecification = getSpecification;
const saveSpecification = async (req, res) => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.userId || req.user?.id;
        const updated = await specificationService_1.SpecificationService.saveSpecification(id, req.body, userId);
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to save specification' });
    }
};
exports.saveSpecification = saveSpecification;
const restoreSpecificationVersion = async (req, res) => {
    try {
        const id = String(req.params.id);
        const versionId = String(req.params.versionId);
        const userId = req.user?.userId || req.user?.id;
        const restored = await specificationService_1.SpecificationService.restoreVersion(id, versionId, userId);
        res.json(restored);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to restore specification version' });
    }
};
exports.restoreSpecificationVersion = restoreSpecificationVersion;
const exportSpecificationPdf = async (req, res) => {
    try {
        const id = String(req.params.id);
        const result = await specificationService_1.SpecificationService.exportPdf(id);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to export specification PDF' });
    }
};
exports.exportSpecificationPdf = exportSpecificationPdf;
const getApplicants = async (req, res) => {
    try {
        const id = String(req.params.id);
        const applicants = await db_1.prisma.applicant.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'asc' },
        });
        res.json(applicants);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getApplicants = getApplicants;
const addApplicant = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { name, applicantType, address, country, nationality, email, phone, isPrimary } = req.body;
        const applicant = await db_1.prisma.applicant.create({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addApplicant = addApplicant;
const deleteApplicant = async (req, res) => {
    try {
        const applicantId = String(req.params.applicantId);
        await db_1.prisma.applicant.delete({ where: { id: applicantId } });
        res.json({ success: true, message: 'Applicant removed' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteApplicant = deleteApplicant;
const getInventors = async (req, res) => {
    try {
        const id = String(req.params.id);
        const inventors = await db_1.prisma.inventor.findMany({
            where: { projectId: id },
            orderBy: { orderIndex: 'asc' },
        });
        res.json(inventors);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getInventors = getInventors;
const addInventor = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { name, address, country, nationality, email, phone, contribution, inventorshipDeclarationSigned, isPrimary } = req.body;
        const count = await db_1.prisma.inventor.count({ where: { projectId: id } });
        const inventor = await db_1.prisma.inventor.create({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addInventor = addInventor;
const deleteInventor = async (req, res) => {
    try {
        const inventorId = String(req.params.inventorId);
        await db_1.prisma.inventor.delete({ where: { id: inventorId } });
        res.json({ success: true, message: 'Inventor removed' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteInventor = deleteInventor;
const runInnovationAnalysis = async (req, res) => {
    try {
        const id = String(req.params.id);
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id },
            include: { patentReferences: true },
        });
        if (!project)
            return res.status(404).json({ error: 'Project not found' });
        const priorArtAbstracts = (project.patentReferences || []).map((r) => r.abstract || '').filter(Boolean);
        const result = await aiProviderService_1.AIProviderService.analyzeInnovation(id, req.user?.id, project.title, project.problemStatement, project.proposedSolution, priorArtAbstracts);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.runInnovationAnalysis = runInnovationAnalysis;
const runClaimSuggestion = async (req, res) => {
    try {
        const { preamble, body } = req.body;
        if (!preamble || !body) {
            return res.status(400).json({ error: 'Claim preamble and body are required' });
        }
        const suggestion = aiProviderService_1.AIProviderService.suggestClaimReview(preamble, body);
        res.json(suggestion);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.runClaimSuggestion = runClaimSuggestion;
const searchIPC = async (req, res) => {
    try {
        const query = (req.query.q || '').trim().toLowerCase();
        const domain = req.query.domain || '';
        const where = {};
        if (domain) {
            where.domain = { contains: domain, mode: 'insensitive' };
        }
        const all = await db_1.prisma.iPCClassification.findMany({ where, take: 50 });
        if (!query)
            return res.json(all);
        const filtered = all.filter((ipc) => ipc.fullSymbol.toLowerCase().includes(query) ||
            ipc.title.toLowerCase().includes(query) ||
            (ipc.description && ipc.description.toLowerCase().includes(query)) ||
            (ipc.keywords && ipc.keywords.toLowerCase().includes(query)));
        res.json(filtered);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.searchIPC = searchIPC;
