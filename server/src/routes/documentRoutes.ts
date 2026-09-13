import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/authMiddleware';
import { uploadDocument, deleteDocument, downloadDocument } from '../controllers/documentController';
import { authorize } from '../policies/middleware/authorize';
import { DocumentPolicy } from '../policies/document/document.policy';
import { prisma } from '../config/db';

const router = Router();

// Configure Multer for project files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt'];
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Supported file types: PDF, DOC, DOCX, PNG, JPG, JPEG, TXT') as any, false);
    }
  },
});

// Authenticate all document operations
router.use(authenticateToken as any);

router.post(
  '/upload',
  upload.single('document') as any,
  authorize(async (user, req) => {
    const projectId = req.body.projectId;
    if (!projectId) return false;
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) return false;
    return DocumentPolicy.canUpload(user, project);
  }) as any,
  uploadDocument as any
);

router.get(
  '/:id/download',
  authorize(async (user, req) => {
    const docId = req.params.id;
    if (!docId) return false;
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: { project: { include: { members: true } } },
    });
    if (!doc) return false;
    return DocumentPolicy.canDownload(user, doc.project, doc);
  }) as any,
  downloadDocument as any
);

router.delete(
  '/:id',
  authorize(async (user, req) => {
    const docId = req.params.id;
    if (!docId) return false;
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: { project: { include: { members: true } } },
    });
    if (!doc) return false;
    return DocumentPolicy.canDelete(user, doc.project, doc);
  }) as any,
  deleteDocument as any
);

export default router;
