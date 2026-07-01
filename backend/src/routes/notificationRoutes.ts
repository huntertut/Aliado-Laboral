import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all notifications for user
router.get('/', authMiddleware, async (req: any, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'No autorizado' });

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req: any, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'No autorizado' });

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark single as read
router.put('/:id/read', authMiddleware, async (req: any, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ error: 'No autorizado' });

        const notification = await prisma.notification.findFirst({
            where: { id, userId }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
