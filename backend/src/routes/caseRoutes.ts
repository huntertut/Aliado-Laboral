import { Router } from 'express';
import { createCase, getUserCases, addHistoryEvent } from '../controllers/caseController';

const router = Router();

router.post('/', createCase);
router.get('/user/:userId', getUserCases);
router.post('/:caseId/history', addHistoryEvent);

export default router;
