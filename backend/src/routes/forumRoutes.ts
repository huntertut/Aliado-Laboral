import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as forumController from '../controllers/forumController';

const router = Router();

// Public / Hybrid
router.get('/posts', forumController.getPosts);
router.get('/posts/:postId', forumController.getPostDetails);

// Protected
router.post('/posts', authenticateToken, forumController.createPost);
router.post('/posts/:postId/answer', authenticateToken, forumController.answerPost);
router.post('/answers/:answerId/vote', authenticateToken, forumController.voteAnswer);

export default router;
