import express from 'express';
import { reportUserFraud } from '../controllers/reportController';
import { authMiddleware as authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Only Lawyers can report fraud
router.post('/fraud/:requestId', authenticateToken, requireRole(['lawyer']), reportUserFraud);

export default router;
