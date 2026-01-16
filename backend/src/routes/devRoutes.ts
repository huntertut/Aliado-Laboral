import { Router } from 'express';
import { seedProductionUsers, triggerNewsManually } from '../controllers/devController';

const router = Router();

// Protected by query param ?secret=hunter2_production_secret
// Protected by query param ?secret=hunter2_production_secret
router.post('/seed-production', seedProductionUsers); // Changed to POST to match previous attempts
router.post('/trigger-news', triggerNewsManually);

export default router;
