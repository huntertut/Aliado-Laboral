import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TEMPORARY ENDPOINT - FOR DEVELOPMENT ONLY
export const updateUserPlan = async (req: Request, res: Response) => {
    try {
        const { email, plan } = req.body;

        const user = await prisma.user.update({
            where: { email },
            data: { plan }
        });

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error updating user plan:', error);
        res.status(500).json({ error: 'Failed to update user plan' });
    }
};
