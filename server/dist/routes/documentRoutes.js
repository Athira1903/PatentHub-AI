"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const documentController_1 = require("../controllers/documentController");
const authorize_1 = require("../policies/middleware/authorize");
const document_policy_1 = require("../policies/document/document.policy");
const db_1 = require("../config/db");
const router = (0, express_1.Router)();
// Configure Multer for project files
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
    },
    fileFilter: (_req, file, cb) => {
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt'];
        const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Supported file types: PDF, DOC, DOCX, PNG, JPG, JPEG, TXT'), false);
        }
    },
});
// Authenticate all document operations
router.use(authMiddleware_1.authenticateToken);
router.post('/upload', upload.single('document'), (0, authorize_1.authorize)(async (user, req) => {
    const projectId = req.body.projectId;
    if (!projectId)
        return false;
    const project = await db_1.prisma.patentProject.findUnique({
        where: { id: projectId },
        include: { members: true },
    });
    if (!project)
        return false;
    return document_policy_1.DocumentPolicy.canUpload(user, project);
}), documentController_1.uploadDocument);
router.delete('/:id', (0, authorize_1.authorize)(async (user, req) => {
    const docId = req.params.id;
    if (!docId)
        return false;
    const doc = await db_1.prisma.document.findUnique({
        where: { id: docId },
        include: { project: { include: { members: true } } },
    });
    if (!doc)
        return false;
    return document_policy_1.DocumentPolicy.canDelete(user, doc.project, doc);
}), documentController_1.deleteDocument);
exports.default = router;
