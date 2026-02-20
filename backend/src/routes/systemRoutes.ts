import express from 'express';
import { getPublicConfig, updateConfig } from '../controllers/systemController';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = express.Router();

// Public endpoint (for banners)
router.get('/public', getPublicConfig);

// Admin endpoint (protected)
router.put('/update', authMiddleware, adminMiddleware, updateConfig);

export default router;
