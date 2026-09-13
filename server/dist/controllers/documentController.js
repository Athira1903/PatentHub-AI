"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadDocument = exports.deleteDocument = exports.uploadDocument = void 0;
const db_1 = require("../config/db");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const notification_policy_1 = require("../policies/notification/notification.policy");
const activityService_1 = require("../services/activityService");
const uploadDocument = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        const { projectId } = req.body;
        if (!projectId) {
            res.status(400).json({ message: 'Project ID is required.' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded.' });
            return;
        }
        // Verify project exists
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: { members: true },
        });
        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }
        // Ensure documents upload directory exists
        const uploadDir = path_1.default.join(__dirname, '../../public/uploads/documents');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        const originalName = req.file.originalname;
        const fileExtension = path_1.default.extname(originalName);
        const sanitizedFileName = `doc_${projectId}_${Date.now()}${fileExtension}`;
        const filePath = path_1.default.join(uploadDir, sanitizedFileName);
        // Save the file buffer
        fs_1.default.writeFileSync(filePath, req.file.buffer);
        const fileUrl = `/uploads/documents/${sanitizedFileName}`;
        const category = req.body.category || 'SUPPORTING';
        // Create database document record
        const document = await db_1.prisma.document.create({
            data: {
                name: originalName,
                fileUrl,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
                version: 1,
                category,
                projectId,
            },
        });
        // Create dynamic notification for team members
        const sender = await db_1.prisma.user.findUnique({ where: { id: userId } });
        const membersToNotify = project.members.filter((m) => m.userId !== userId);
        // Notify others if the owner uploaded, or notify owner/others if a member uploaded
        const notificationPromises = [];
        if (notification_policy_1.NotificationPolicy.shouldNotifyDocumentUploaded(userId, project.ownerId)) {
            notificationPromises.push(db_1.prisma.notification.create({
                data: {
                    userId: project.ownerId,
                    title: 'New Document Uploaded',
                    message: `${sender?.fullName || sender?.username} uploaded "${originalName}" to your project.`,
                    type: 'GENERAL',
                    referenceId: projectId,
                },
            }));
        }
        for (const member of membersToNotify) {
            if (notification_policy_1.NotificationPolicy.shouldNotifyDocumentUploaded(userId, member.userId)) {
                notificationPromises.push(db_1.prisma.notification.create({
                    data: {
                        userId: member.userId,
                        title: 'New Document Uploaded',
                        message: `${sender?.fullName || sender?.username} uploaded "${originalName}" to project "${project.title}".`,
                        type: 'GENERAL',
                        referenceId: projectId,
                    },
                }));
            }
        }
        await Promise.all(notificationPromises);
        // Record Activity Log
        await activityService_1.ActivityService.createActivity(projectId, userId, `Uploaded document "${originalName}" (v${document.version}).`, 'DOCUMENT', { documentId: document.id, category: document.category });
        res.status(201).json({ message: 'Document uploaded successfully', document });
    }
    catch (error) {
        console.error('[Document Upload Error]', error);
        res.status(500).json({ message: error.message || 'Failed to upload document.' });
    }
};
exports.uploadDocument = uploadDocument;
const deleteDocument = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ message: 'Document ID is required.' });
            return;
        }
        // Fetch document
        const document = await db_1.prisma.document.findUnique({
            where: { id },
        });
        if (!document) {
            res.status(404).json({ message: 'Document not found.' });
            return;
        }
        // Delete physically if exists
        const relativePath = document.fileUrl.replace('/uploads/documents/', '');
        const physicalPath = path_1.default.join(__dirname, '../../public/uploads/documents', relativePath);
        if (fs_1.default.existsSync(physicalPath)) {
            fs_1.default.unlinkSync(physicalPath);
        }
        // Delete database entry
        await db_1.prisma.document.delete({
            where: { id },
        });
        // Log Activity
        await db_1.prisma.activityLog.create({
            data: {
                userId,
                projectId: document.projectId,
                action: `Deleted document: "${document.name}".`,
            },
        });
        res.status(200).json({ message: 'Document deleted successfully.' });
    }
    catch (error) {
        console.error('[Document Delete Error]', error);
        res.status(500).json({ message: error.message || 'Failed to delete document.' });
    }
};
exports.deleteDocument = deleteDocument;
const downloadDocument = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ message: 'Document ID is required.' });
            return;
        }
        const document = await db_1.prisma.document.findUnique({
            where: { id },
        });
        if (!document) {
            res.status(404).json({ message: 'Document not found.' });
            return;
        }
        const relativePath = document.fileUrl.replace('/uploads/documents/', '');
        const physicalPath = path_1.default.join(__dirname, '../../public/uploads/documents', relativePath);
        if (!fs_1.default.existsSync(physicalPath)) {
            res.status(404).json({ message: 'Physical document file not found on server storage.' });
            return;
        }
        res.download(physicalPath, document.name);
    }
    catch (error) {
        console.error('[Document Download Error]', error);
        res.status(500).json({ message: error.message || 'Failed to download document.' });
    }
};
exports.downloadDocument = downloadDocument;
