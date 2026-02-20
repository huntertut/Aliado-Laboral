import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as forumController from '../controllers/forumController';

const router = Router();

// Public / Hybrid
router.get('/posts', forumController.getPosts);
router.get('/posts/:postId', forumController.getPostDetails);

// Protected
router.post('/posts', authMiddleware, forumController.createPost);
router.post('/posts/:postId/answer', authMiddleware, forumController.answerPost);
router.post('/answers/:answerId/vote', authMiddleware, forumController.voteAnswer);

// Moderation & Management
router.delete('/posts/:postId', authMiddleware, forumController.deletePost);
router.put('/posts/:postId/hide', authMiddleware, forumController.hidePost);
router.delete('/answers/:answerId', authMiddleware, forumController.deleteAnswer);

export default router;
