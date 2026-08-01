import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  createProfile,
  getProfile,
  updateProfile,
  uploadPhoto,
  deletePhoto,
} from '../controllers/profileController';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, JPEG) are allowed.') as any, false);
    }
  },
});

// Protect all profile endpoints with JWT verification middleware
router.use(authenticateToken as any);

router.post('/create', createProfile as any);
router.get('/me', getProfile as any);
router.put('/update', updateProfile as any);
router.post('/upload-photo', upload.single('photo') as any, uploadPhoto as any);
router.delete('/photo', deletePhoto as any);

export default router;