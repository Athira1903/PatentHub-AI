"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveProject = exports.inviteMember = exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getProjects = exports.createProject = void 0;
const zod_1 = require("zod");
const projectService_1 = require("../services/projectService");
const createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, 'Title must be at least 3 characters'),
    innovationIdea: zod_1.z.string().trim().min(10, 'Innovation abstract must be at least 10 characters'),
    problemStatement: zod_1.z.string().trim().min(10, 'Problem statement must be at least 10 characters'),
    proposedSolution: zod_1.z.string().trim().min(10, 'Proposed solution must be at least 10 characters'),
    objectives: zod_1.z.string().trim().optional(),
    technicalDomain: zod_1.z.string().trim().min(2, 'Technical domain is required'),
    keywords: zod_1.z.string().trim().optional(),
    category: zod_1.z.string().trim().min(2, 'Category is required'),
    expectedFilingDate: zod_1.z.string().optional().transform((val) => val ? new Date(val) : undefined),
    patentType: zod_1.z.string().trim().optional(),
    visibility: zod_1.z.string().trim().optional(),
});
const updateProjectSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3).optional(),
    innovationIdea: zod_1.z.string().trim().min(10).optional(),
    problemStatement: zod_1.z.string().trim().min(10).optional(),
    proposedSolution: zod_1.z.string().trim().min(10).optional(),
    objectives: zod_1.z.string().trim().optional(),
    technicalDomain: zod_1.z.string().trim().min(2).optional(),
    keywords: zod_1.z.string().trim().optional(),
    category: zod_1.z.string().trim().min(2).optional(),
    stage: zod_1.z.enum([
        'IDEA',
        'LITERATURE_REVIEW',
        'PROTOTYPE',
        'DOCUMENTATION',
        'FORMS_PREPARATION',
        'GUIDE_REVIEW',
        'PATENT_EXPERT_REVIEW',
        'FILING_READY',
    ]).optional(),
    expectedFilingDate: zod_1.z.string().optional().transform((val) => val ? new Date(val) : undefined),
    patentType: zod_1.z.string().trim().optional(),
    visibility: zod_1.z.string().trim().optional(),
    isArchived: zod_1.z.boolean().optional(),
});
const inviteMemberSchema = zod_1.z.object({
    username: zod_1.z.string().trim().min(1, 'Username is required'),
    role: zod_1.z.enum(['CO_INVENTOR', 'GUIDE', 'PATENT_EXPERT']).optional().default('CO_INVENTOR'),
});
const createProject = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const validatedData = createProjectSchema.parse(req.body);
        const project = await projectService_1.ProjectService.createProject({
            ...validatedData,
            ownerId: req.user.userId,
        });
        res.status(201).json({ message: 'Project created successfully', project });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: error.errors[0]?.message || 'Validation failed' });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to create project' });
    }
};
exports.createProject = createProject;
const getProjects = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const includeArchived = req.query.archived === 'true';
        const projects = await projectService_1.ProjectService.getUserProjects(req.user.userId, req.user.role, includeArchived);
        res.status(200).json({ projects });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch projects' });
    }
};
exports.getProjects = getProjects;
const getProjectById = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const projectId = req.params.id;
        const project = await projectService_1.ProjectService.getProjectById(projectId, req.user.userId, req.user.role);
        res.status(200).json({ project });
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Project not found' });
    }
};
exports.getProjectById = getProjectById;
const updateProject = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const projectId = req.params.id;
        const validatedData = updateProjectSchema.parse(req.body);
        const project = await projectService_1.ProjectService.updateProject(projectId, req.user.userId, validatedData);
        res.status(200).json({ message: 'Project updated successfully', project });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: error.errors[0]?.message || 'Validation failed' });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to update project' });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const projectId = req.params.id;
        await projectService_1.ProjectService.deleteProject(projectId, req.user.userId);
        res.status(200).json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to delete project' });
    }
};
exports.deleteProject = deleteProject;
const inviteMember = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const projectId = req.params.id;
        const validatedData = inviteMemberSchema.parse(req.body);
        const member = await projectService_1.ProjectService.inviteMemberByUsername(projectId, req.user.userId, validatedData.username, validatedData.role);
        res.status(201).json({ message: 'Team member added successfully', member });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: error.errors[0]?.message || 'Validation failed' });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to add team member' });
    }
};
exports.inviteMember = inviteMember;
const archiveProject = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const projectId = req.params.id;
        const isArchived = req.body.isArchived !== false; // defaults to true
        await projectService_1.ProjectService.archiveProject(projectId, req.user.userId, isArchived);
        res.status(200).json({ message: `Project ${isArchived ? 'archived' : 'unarchived'} successfully` });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update archive status' });
    }
};
exports.archiveProject = archiveProject;
