import { Router } from 'express';
import { chatWithAI } from '../controllers/aiController';
import { optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

router.post('/chat', optionalAuthMiddleware, chatWithAI);

export default router;
