import { Router } from 'express';
import { generateCaseFile } from '../controllers/documentController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Only Lawyers and Admins can see the full case file
router.get('/case-file/:requestId', authMiddleware, requireRole(['lawyer', 'admin']), generateCaseFile);

export default router;
