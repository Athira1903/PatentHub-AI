import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/authMiddleware';
import { uploadDocument, deleteDocument } from '../controllers/documentController';

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

router.post('/upload', upload.single('document') as any, uploadDocument as any);
router.delete('/:id', deleteDocument as any);

export default router;
