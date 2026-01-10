import { Router } from 'express';
import { seedProductionUsers } from '../controllers/devController';

const router = Router();

// Protected by query param ?secret=hunter2_production_secret
router.post('/seed', seedProductionUsers);

export default router;
