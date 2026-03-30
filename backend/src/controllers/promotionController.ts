import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ADMIN: Get all promotions
export const getPromotions = async (req: Request, res: Response) => {
    try {
        const promotions = await prisma.promotion.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ADMIN: Create a new promotion
export const createPromotion = async (req: Request, res: Response) => {
    try {
        const { title, description, targetRole, type, value, isActive, startDate, endDate, maxUses } = req.body;

        const promotion = await prisma.promotion.create({
            data: {
                title,
                description,
                targetRole,
                type,
                value: parseInt(value),
                isActive: isActive ?? true,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                maxUses: maxUses ? parseInt(maxUses) : null,
            }
        });

        res.status(201).json(promotion);
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ADMIN: Update an existing promotion
export const updatePromotion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, targetRole, type, value, isActive, startDate, endDate, maxUses } = req.body;

        const promotion = await prisma.promotion.update({
            where: { id },
            data: {
                title,
                description,
                targetRole,
                type,
                value: value ? parseInt(value) : undefined,
                isActive,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                maxUses: maxUses ? parseInt(maxUses) : null,
            }
        });

        res.json(promotion);
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ADMIN: Delete a promotion
export const deletePromotion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.promotion.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUBLIC: Get active promotions for a specific role
export const getActivePromotions = async (req: Request, res: Response) => {
    try {
        const { role } = req.query; // e.g., ?role=lawyer

        const now = new Date();
        const activePromos = await prisma.promotion.findMany({
            where: {
                isActive: true,
                OR: [
                    { targetRole: 'ALL' },
                    { targetRole: (role as string) || 'ALL' }
                ],
                // Check dates if they exist
                AND: [
                    {
                        OR: [
                            { startDate: null },
                            { startDate: { lte: now } }
                        ]
                    },
                    {
                        OR: [
                            { endDate: null },
                            { endDate: { gte: now } }
                        ]
                    }
                ]
            }
        });

        res.json(activePromos);
    } catch (error) {
        console.error('Error fetching active promotions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
