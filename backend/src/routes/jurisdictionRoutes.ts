import express from 'express';
import { getJurisdiction } from '../controllers/jurisdictionController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Ruta abierta para buscar jurisdicción (No requiere auth porque es info pública general)
router.post('/find', getJurisdiction);

export default router;
