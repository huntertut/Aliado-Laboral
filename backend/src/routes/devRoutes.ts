import { Router } from 'express';
import { seedProductionUsers } from '../controllers/devController';

const router = Router();

// Protected by query param ?secret=hunter2_production_secret
router.get('/seed', seedProductionUsers);

export default router;
