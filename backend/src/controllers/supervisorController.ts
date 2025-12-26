import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Pending Lawyers (unverified or verification requested)
export const getPendingLawyers = async (req: Request, res: Response) => {
    try {
        // Fetch lawyers where isVerified is false
        // Include partial User data for display (name, email)
        const lawyers = await prisma.lawyer.findMany({
            where: { isVerified: false },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                },
                profile: true, // Include extend profile for details if needed
                subscription: true
            }
        });

        res.json(lawyers);
    } catch (error) {
        console.error('Error fetching pending lawyers:', error);
        res.status(500).json({ error: 'Error interno al obtener abogados pendientes' });
    }
};

// Verify Lawyer
export const verifyLawyer = async (req: Request, res: Response) => {
    const { id } = req.params; // Is this Lawyer.id or User.id? Let's assume Lawyer.id for precision

    try {
        const updatedLawyer = await prisma.lawyer.update({
            where: { id },
            data: { isVerified: true }
        });

        // Log the action (ActivityLog)
        // If we had the supervisor's ID from req.user, we'd log it

        res.json({ message: 'Abogado verificado correctamente', lawyer: updatedLawyer });
    } catch (error) {
        console.error('Error verifying lawyer:', error);
        res.status(500).json({ error: 'No se pudo verificar al abogado' });
    }
};
