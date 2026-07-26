"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteMember = exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getProjects = exports.createProject = void 0;
const zod_1 = require("zod");
const projectService_1 = require("../services/projectService");
const createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    innovationIdea: zod_1.z.string().min(10, 'Innovation idea must be at least 10 characters'),
    problemStatement: zod_1.z.string().min(10, 'Problem statement must be at least 10 characters'),
    proposedSolution: zod_1.z.string().min(10, 'Proposed solution must be at least 10 characters'),
    technicalDomain: zod_1.z.string().min(2, 'Technical domain is required'),
    category: zod_1.z.string().min(2, 'Category is required'),
});
const updateProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).optional(),
    innovationIdea: zod_1.z.string().min(10).optional(),
    problemStatement: zod_1.z.string().min(10).optional(),
    proposedSolution: zod_1.z.string().min(10).optional(),
    technicalDomain: zod_1.z.string().min(2).optional(),
    category: zod_1.z.string().min(2).optional(),
    stage: zod_1.z.enum([
        'IDEA',
        'PATENT_SEARCH',
        'PROTOTYPE_PLANNING',
        'PROTOTYPE_DEVELOPMENT',
        'DOCUMENTATION',
        'GUIDE_REVIEW',
        'PATENT_FORMS',
        'READY_FOR_FILING',
    ]).optional(),
});
const inviteMemberSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'Username is required'),
    role: zod_1.z.enum(['CO_INVENTOR', 'GUIDE']).optional().default('CO_INVENTOR'),
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
        const projects = await projectService_1.ProjectService.getUserProjects(req.user.userId);
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
        const project = await projectService_1.ProjectService.getProjectById(projectId, req.user.userId);
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
        res.status(400).json({ message: error.message || 'Failed to add team member' });
    }
};
exports.inviteMember = inviteMember;
