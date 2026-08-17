"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComment = exports.deleteTask = exports.updateTask = exports.createTask = exports.getProjectTasks = exports.getProjectActivity = exports.archiveProject = exports.inviteMember = exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getProjects = exports.createProject = void 0;
const zod_1 = require("zod");
const projectService_1 = require("../services/projectService");
const db_1 = require("../config/db");
const workflow_policy_1 = require("../policies/workflow/workflow.policy");
const createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, 'Title must be at least 3 characters'),
    innovationIdea: zod_1.z.string().trim().min(10, 'Innovation abstract must be at least 10 characters'),
    problemStatement: zod_1.z.string().trim().min(10, 'Problem statement must be at least 10 characters'),
    existingSolutions: zod_1.z.string().trim().optional(),
    drawbacks: zod_1.z.string().trim().optional(),
    proposedSolution: zod_1.z.string().trim().min(10, 'Proposed solution must be at least 10 characters'),
    objectives: zod_1.z.string().trim().optional(),
    novelFeatures: zod_1.z.string().trim().optional(),
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
    existingSolutions: zod_1.z.string().trim().optional(),
    drawbacks: zod_1.z.string().trim().optional(),
    proposedSolution: zod_1.z.string().trim().min(10).optional(),
    objectives: zod_1.z.string().trim().optional(),
    novelFeatures: zod_1.z.string().trim().optional(),
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
        'FILED',
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
        const isOwner = req.project.ownerId === req.user.userId || req.user.role === 'Admin';
        res.status(200).json({ project: { ...req.project, isOwner } });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch project' });
    }
};
exports.getProjectById = getProjectById;
const updateProject = async (req, res) => {
    try {
        const validatedData = updateProjectSchema.parse(req.body);
        // Validate workflow stage transition if requested
        if (validatedData.stage) {
            const isAllowed = await workflow_policy_1.WorkflowPolicy.canMoveToStage(req.user, req.project, validatedData.stage);
            if (!isAllowed) {
                res.status(403).json({ message: `Workflow stage transition to ${validatedData.stage} is not allowed.` });
                return;
            }
        }
        const project = await projectService_1.ProjectService.updateProject(req.project.id, req.user.userId, validatedData);
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
        await projectService_1.ProjectService.deleteProject(req.project.id, req.user.userId);
        res.status(200).json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to delete project' });
    }
};
exports.deleteProject = deleteProject;
const inviteMember = async (req, res) => {
    try {
        const validatedData = inviteMemberSchema.parse(req.body);
        const member = await projectService_1.ProjectService.inviteMemberByUsername(req.project.id, req.user.userId, validatedData.username, validatedData.role);
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
        const isArchived = req.body.isArchived !== false; // defaults to true
        await projectService_1.ProjectService.archiveProject(req.project.id, req.user.userId, isArchived);
        res.status(200).json({ message: `Project ${isArchived ? 'archived' : 'unarchived'} successfully` });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update archive status' });
    }
};
exports.archiveProject = archiveProject;
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, 'Title must be at least 3 characters'),
    description: zod_1.z.string().trim().optional(),
    assignedToUsername: zod_1.z.string().trim().optional(),
});
const updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().trim().optional(),
    description: zod_1.z.string().trim().optional(),
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
    assignedToId: zod_1.z.string().trim().optional().nullable(),
});
const activityService_1 = require("../services/activityService");
const taskService_1 = require("../services/taskService");
const getProjectActivity = async (req, res) => {
    try {
        const projectId = req.params.id;
        const filterType = req.query.type;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
        const activities = await activityService_1.ActivityService.listProjectActivities(projectId, filterType, limit, skip);
        res.status(200).json({ success: true, activities });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch project activity timeline.' });
    }
};
exports.getProjectActivity = getProjectActivity;
const getProjectTasks = async (req, res) => {
    try {
        const projectId = req.params.id;
        const statusFilter = req.query.status;
        const tasks = await taskService_1.TaskService.getProjectTasks(projectId, statusFilter);
        res.status(200).json({ success: true, tasks });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch project tasks.' });
    }
};
exports.getProjectTasks = getProjectTasks;
const createTask = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { title, description, assignedToId, priority, dueDate } = req.body;
        const task = await taskService_1.TaskService.createTask(projectId, req.user.userId, {
            title,
            description,
            assignedToId,
            priority,
            dueDate
        });
        res.status(201).json({ message: 'Task created successfully', task });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create task' });
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    try {
        const projectId = req.params.id;
        const taskId = req.params.taskId;
        const { title, description, status, priority, assignedToId, dueDate } = req.body;
        const task = await taskService_1.TaskService.updateTask(projectId, taskId, req.user.userId, {
            title,
            description,
            status,
            priority,
            assignedToId,
            dueDate
        });
        res.status(200).json({ message: 'Task updated successfully', task });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update task' });
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    try {
        const projectId = req.params.id;
        const taskId = req.params.taskId;
        await taskService_1.TaskService.deleteTask(projectId, taskId, req.user.userId);
        res.status(200).json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to delete task' });
    }
};
exports.deleteTask = deleteTask;
const createComment = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            res.status(400).json({ message: 'Comment content is required.' });
            return;
        }
        const comment = await db_1.prisma.comment.create({
            data: {
                content: content.trim(),
                projectId: req.project.id,
                userId: req.user.userId,
            },
            include: {
                user: { select: { id: true, fullName: true, username: true, role: true } },
            },
        });
        // Log Activity
        await db_1.prisma.activityLog.create({
            data: {
                userId: req.user.userId,
                projectId: req.project.id,
                action: `Added review comment: "${content.trim().substring(0, 60)}${content.trim().length > 60 ? '...' : ''}"`,
            },
        });
        res.status(201).json({ message: 'Comment added successfully.', comment });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to add comment.' });
    }
};
exports.createComment = createComment;
