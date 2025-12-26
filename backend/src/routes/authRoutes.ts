import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { verifyFirebaseToken } from '../controllers/firebaseAuthController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-token', verifyFirebaseToken);

export default router;
