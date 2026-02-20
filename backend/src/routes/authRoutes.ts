import { Router } from 'express';
import { register, login, socialLogin, updateProfile, updatePushToken, sendPhoneVerification, verifyPhone } from '../controllers/authController';
import { verifyFirebaseToken } from '../controllers/firebaseAuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.put('/update-profile', authMiddleware, updateProfile);
router.post('/update-push-token', authMiddleware, updatePushToken);
router.post('/send-verification', authMiddleware, sendPhoneVerification); // New
router.post('/verify-phone', authMiddleware, verifyPhone); // New
router.post('/verify-token', verifyFirebaseToken);

export default router;
