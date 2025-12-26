import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
    getMySubscription,
    createSubscription,
    cancelMySubscription,
} from '../controllers/workerSubscriptionController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get my subscription status
router.get('/my-subscription', getMySubscription);

// Create/activate subscription
router.post('/subscribe', createSubscription);

// Cancel subscription
router.post('/cancel', cancelMySubscription);

export default router;
