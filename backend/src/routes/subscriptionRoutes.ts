import express from 'express';
import { authMiddleware as authenticateToken } from '../middleware/auth';
import {
    getSubscriptionStatus,
    activateSubscription,
    confirmPayment,
    activateFreeSubscription,
    cancelAutoRenew
} from '../controllers/subscriptionController';

const router = express.Router();

router.get('/status', authenticateToken, getSubscriptionStatus);
router.post('/activate', authenticateToken, activateSubscription);
router.post('/confirm-payment', authenticateToken, confirmPayment);
router.post('/activate-free', authenticateToken, activateFreeSubscription);
router.post('/cancel-auto-renew', authenticateToken, cancelAutoRenew);

export default router;
