
import express from 'express';
import { getPublicConfig, updateConfig } from '../controllers/systemController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public endpoint (for banners)
router.get('/public', getPublicConfig);

// Admin endpoint (protected)
router.put('/update', authenticateToken, isAdmin, updateConfig);

export default router;
