import { Router } from 'express';
import { register, login, getProfile, sendOtp, verifyOtpReset, googleLogin, activate } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/activate', activate);
router.post('/google-login', googleLogin);
router.get('/profile', authenticateToken, getProfile);
router.post('/send-otp', sendOtp);
router.post('/verify-otp-reset', verifyOtpReset);

export default router;
