import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as chatController from '../controllers/chatController';

const router = Router();

// Send a message (User or Lawyer)
router.post('/messages', authMiddleware, chatController.sendMessage);

// Get conversation with a specific contact request
router.get('/messages/:contactRequestId', authMiddleware, chatController.getMessages);

// Mark messages as read
router.put('/messages/:contactRequestId/read', authMiddleware, chatController.markMessagesAsRead);

export default router;
