import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all verified lawyers
export const getLawyers = async (req: Request, res: Response) => {
    try {
        const lawyers = await prisma.lawyer.findMany({
            where: { isVerified: true },
            include: {
                user: {
                    select: { fullName: true, email: true }
                }
            }
        });
        res.json(lawyers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get lawyer by ID
export const getLawyerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const lawyer = await prisma.lawyer.findUnique({
            where: { id },
            include: {
                user: {
                    select: { fullName: true, email: true }
                }
            }
        });

        if (!lawyer) {
            return res.status(404).json({ error: 'Lawyer not found' });
        }

        res.json(lawyer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Contact lawyer (Mock implementation for MVP)
export const contactLawyer = async (req: Request, res: Response) => {
    try {
        const { lawyerId, message, userContact } = req.body;

        // In a real app, this would send an email or push notification to the lawyer
        // and create a record in a 'LawyerRequest' table.

        console.log(`Contact request for lawyer ${lawyerId}:`, { message, userContact });

        res.json({ message: 'Solicitud enviada con éxito. El abogado te contactará pronto.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
