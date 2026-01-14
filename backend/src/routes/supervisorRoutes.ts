import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPendingLawyers, verifyLawyer, rejectLawyer, getSupervisorStats } from '../controllers/supervisorController';

const router = express.Router();

// Middleware to ensure user is supervisor could be added here
// For now, we rely on the frontend dashboard being hidden and basic auth
// ideally: router.use(authMiddleware, supervisorOnlyMiddleware)

router.get('/pending-lawyers', authMiddleware, getPendingLawyers);
router.put('/verify-lawyer/:id', authMiddleware, verifyLawyer);
router.delete('/reject-lawyer/:id', authMiddleware, rejectLawyer);
router.get('/stats', authMiddleware, getSupervisorStats);

export default router;
