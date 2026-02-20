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

// Verify Lawyer (Approve)
export const verifyLawyer = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const updatedLawyer = await prisma.lawyer.update({
            where: { id },
            data: { isVerified: true }
        });

        res.json({ message: 'Abogado verificado correctamente', lawyer: updatedLawyer });
    } catch (error) {
        console.error('Error verifying lawyer:', error);
        res.status(500).json({ error: 'No se pudo verificar al abogado' });
    }
};

// Reject Lawyer (Downgrade to User, delete Lawyer profile)
export const rejectLawyer = async (req: Request, res: Response) => {
    const { id } = req.params; // Lawyer ID

    try {
        const lawyer = await prisma.lawyer.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!lawyer) {
            return res.status(404).json({ error: 'Abogado no encontrado' });
        }

        // 1. Update User role back to 'worker' (or 'user')
        await prisma.user.update({
            where: { id: lawyer.userId },
            data: { role: 'worker', plan: 'free' } // Reset to basic
        });

        // 2. Delete Lawyer record (Cascade should handle profile/subscription if configured, but let's be safe)
        // Actually, Prisma schema typically uses cascade. Let's delete Lawyer.
        await prisma.lawyer.delete({
            where: { id }
        });

        res.json({ message: 'Solicitud rechazada y usuario regresado al rol básico.' });
    } catch (error) {
        console.error('Error rejecting lawyer:', error);
        res.status(500).json({ error: 'Error al rechazar abogado' });
    }
};

// Toggle Verification (Suspend/Verify)
export const toggleLawyerVerification = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isVerified } = req.body;

    try {
        const updatedLawyer = await prisma.lawyer.update({
            where: { id },
            data: { isVerified }
        });
        res.json({ message: `Abogado ${isVerified ? 'verificado' : 'suspendido'}`, lawyer: updatedLawyer });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar verificación' });
    }
};


export const getSupervisorStats = async (req: Request, res: Response) => {
    try {
        // 1. Pending Lawyers
        const pendingLawyersCount = await prisma.lawyer.count({
            where: { isVerified: false }
        });

        // 2. Recent Payment Activity (Last 24h)
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const recentPaymentsCount = await prisma.contactRequest.count({
            where: {
                status: 'accepted',
                bothPaymentsSucceeded: true,
                acceptedAt: { gte: oneDayAgo }
            }
        });

        res.json({
            pendingLawyersCount,
            recentPaymentsCount
        });
    } catch (error) {
        console.error('Error fetching supervisor stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};
