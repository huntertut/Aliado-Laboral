import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new legal case
export const createCase = async (req: Request, res: Response) => {
    try {
        const { userId, title, employerName, startDate } = req.body;

        const newCase = await prisma.legalCase.create({
            data: {
                userId,
                title,
                employerName,
                startDate: new Date(startDate),
                status: 'active'
            }
        });

        res.status(201).json(newCase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all cases for a user
export const getUserCases = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const cases = await prisma.legalCase.findMany({
            where: { userId },
            include: {
                history: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(cases);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add an event to a case history
export const addHistoryEvent = async (req: Request, res: Response) => {
    try {
        const { caseId } = req.params;
        const { eventType, description, occurredAt } = req.body;

        const event = await prisma.caseHistory.create({
            data: {
                caseId,
                eventType,
                description,
                occurredAt: new Date(occurredAt)
            }
        });

        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
