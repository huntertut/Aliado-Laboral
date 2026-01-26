import express from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Public (or semi-protected) logging endpoint
// We assume AnalyticsService calls this. Can be protected if we want strictness.
router.post('/events', analyticsController.logEvent);

// Admin-only metrics
router.get('/metrics', authenticateUser as any, analyticsController.getDashboardMetrics);

export default router;
