import express from 'express';
import { getJurisdiction } from '../controllers/jurisdictionController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Ruta protegida para buscar jurisdicción
router.post('/find', authMiddleware, getJurisdiction);

export default router;
