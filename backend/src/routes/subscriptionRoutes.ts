import express from 'express';
import { authMiddleware as authenticateToken } from '../middleware/auth';
import { getSubscriptionStatus, upgradeSubscription } from '../controllers/subscriptionController';

const router = express.Router();

router.get('/status', authenticateToken, getSubscriptionStatus);
router.post('/upgrade', authenticateToken, upgradeSubscription);

export default router;
