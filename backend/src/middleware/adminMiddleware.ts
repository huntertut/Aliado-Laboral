import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Request type to include user
interface AuthRequest extends Request {
    user?: {
        id: string; // Changed from userId to id to match auth middleware
        email: string;
        role: string;
        firebaseUid: string;
    };
}

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // User should already be attached by authMiddleware
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        // Double check against DB to ensure role hasn't changed
        // authMiddleware attaches { id, email, role, firebaseUid } to req.user
        // FIX: Handle both 'id' (Firebase/New) and 'userId' (Legacy JWT)
        const userId = req.user.id || (req.user as any).userId;

        if (!userId) {
            console.error('AdminMiddleware: User ID mismatch', req.user);
            return res.status(401).json({ error: 'Unauthorized: Invalid Token Structure' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
