import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ABOGADO: Reportar Fraude / Información Falsa
 * - Cierra el caso como "Perdido"
 * - Bloquea al usuario permanentemente
 */
export const reportUserFraud = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        const userId = (req as any).user?.id;

        // Verify Lawyer
        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });

        if (!lawyer || !lawyer.profile) {
            return res.status(404).json({ error: 'Abogado no encontrado' });
        }

        const request = await prisma.contactRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });

        if (!request.lawyerProfileId || request.lawyerProfileId !== lawyer.profile.id) {
            return res.status(403).json({ error: 'No autorizado para este caso' });
        }

        // EXECUTE BAN HAMMER 🔨
        await prisma.$transaction([
            // 1. Close Request
            prisma.contactRequest.update({
                where: { id: requestId },
                data: {
                    status: 'rejected',
                    crmStatus: 'CLOSED_LOST',
                    rejectionReason: `FRAUDE: ${reason}`,
                    subStatus: 'fraud_reported'
                }
            }),
            // 2. Block User
            prisma.user.update({
                where: { id: request.workerId },
                data: {
                    isBlocked: true,
                    blockReason: `Reportado por Abogado ${lawyer.licenseNumber}: ${reason}`
                }
            })
        ]);

        console.log(`🚨 USER BLOCKED: ${request.workerId} due to fraud report.`);

        res.json({
            success: true,
            message: 'Usuario bloqueado y caso cerrado. Gracias por mantener la calidad de la red.'
        });

    } catch (error) {
        console.error('Error reporting fraud:', error);
        res.status(500).json({ error: 'Error al reportar fraude' });
    }
};
