import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { createNews, getNewsFeed, deleteNews } from '../controllers/newsController';

const router = express.Router();

// Publicly accessible feed (but adaptive if token present)
// We use authMiddleware optionally or just trust req.user if present
router.get('/', authMiddleware, getNewsFeed);

// Private Admin routes
router.post('/', authMiddleware, adminMiddleware, createNews);
router.delete('/:id', authMiddleware, adminMiddleware, deleteNews);

export default router;
