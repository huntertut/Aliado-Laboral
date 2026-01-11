import { Router } from 'express';
import { register, login, socialLogin, updateProfile, updatePushToken } from '../controllers/authController';
import { verifyFirebaseToken } from '../controllers/firebaseAuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.put('/update-profile', authMiddleware, updateProfile);
router.post('/update-push-token', authMiddleware, updatePushToken); // New Route
router.post('/verify-token', verifyFirebaseToken);

export default router;
