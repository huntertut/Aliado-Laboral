import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// CASES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna los últimos 50 casos (todos los estados).
 * Casos en bolsa pública tienen lawyerName = 'Sin Asignar' e isInPool = true.
 */
export const getAllCases = async (req: Request, res: Response) => {
    try {
        const cases = await prisma.contactRequest.findMany({
            include: {
                worker: { select: { fullName: true, email: true } },
                lawyerProfile: { include: { lawyer: { include: { user: { select: { fullName: true } } } } } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const formattedCases = cases.map(c => ({
            id: c.id,
            workerName: c.worker.fullName,
            lawyerName: c.lawyerProfile?.lawyer?.user?.fullName || 'Sin Asignar',
            status: c.status,
            caseType: c.caseType || 'Laboral',
            urgency: c.urgency || 'Media',
            createdAt: c.createdAt,
            bothPaymentsSucceeded: (c as any).bothPaymentsSucceeded,
            isInPool: c.lawyerProfileId === null // flag para el frontend
        }));

        res.json(formattedCases);
    } catch (error) {
        console.error('Get all cases error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Retorna SOLO los casos en la bolsa pública (lawyerProfileId === null, status === 'pending').
 * Endpoint dedicado para la vista "Bolsa Pública" del admin.
 */
export const getPublicPoolCases = async (req: Request, res: Response) => {
    try {
        const poolCases = await prisma.contactRequest.findMany({
            where: {
                lawyerProfileId: null,
                status: 'pending'
            },
            include: {
                worker: { select: { fullName: true, email: true } }
            },
            orderBy: { createdAt: 'asc' } // Los más antiguos primero (mayor urgencia)
        });

        const formatted = poolCases.map(c => ({
            id: c.id,
            workerName: c.worker.fullName,
            workerEmail: c.worker.email,
            caseType: c.caseType || 'Laboral',
            urgency: c.urgency || 'Media',
            createdAt: c.createdAt,
            daysInPool: Math.floor(
                (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            )
        }));

        res.json({ total: formatted.length, cases: formatted });
    } catch (error) {
        console.error('Get public pool cases error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY
// ─────────────────────────────────────────────────────────────────────────────

export const getSecurityLogs = async (req: Request, res: Response) => {
    try {
        const logs = await prisma.securityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(logs);
    } catch (error) {
        console.error('Get security logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAdminAlerts = async (req: Request, res: Response) => {
    try {
        const alerts = await prisma.adminAlert.findMany({
            orderBy: [
                { isResolved: 'asc' },
                { createdAt: 'desc' }
            ],
            take: 20
        });
        res.json(alerts);
    } catch (error) {
        console.error('Get admin alerts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resolveAlert = async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;
        const alert = await prisma.adminAlert.update({
            where: { id: alertId },
            data: { isResolved: true, resolvedAt: new Date() }
        });
        res.json(alert);
    } catch (error) {
        console.error('Resolve alert error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export const purgeCaseData = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;

        const request = await prisma.contactRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (request.status !== 'accepted' || !request.bothPaymentsSucceeded) {
            return res.status(400).json({
                error: 'La solicitud no cumple con los requisitos para ser purgada (debe estar aceptada y pagada)'
            });
        }

        const legalCases = await prisma.legalCase.findMany({
            where: { userId: request.workerId }
        });
        const caseIds = legalCases.map(lc => lc.id);

        await prisma.caseHistory.deleteMany({
            where: { caseId: { in: caseIds } }
        });

        await prisma.legalCase.deleteMany({
            where: { userId: request.workerId }
        });

        await prisma.contactRequest.delete({
            where: { id: requestId }
        });

        await prisma.activityLog.create({
            data: {
                userId: (req as any).user?.id,
                action: 'PURGE_CASE_DATA',
                details: `Purged case ${requestId} and associated user data for worker ${request.workerId}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        res.json({ success: true, message: 'Case data purged successfully' });

    } catch (error: any) {
        console.error('Error purging case data:', error);
        res.status(500).json({ error: 'Failed to purge case data', details: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// VAULT COMPLIANCE
// ─────────────────────────────────────────────────────────────────────────────

export const getVaultCompliance = async (req: Request, res: Response) => {
    try {
        const anomalies = await prisma.contactRequest.findMany({
            where: {
                OR: [
                    { crmStatus: 'CLOSED_WON', settlementDocStatus: 'none' },
                    { commissionStatus: 'pending', settlementDocStatus: 'none' }
                ]
            },
            include: { lawyerProfile: { include: { lawyer: { include: { user: true } } } } }
        });

        const topEarners = await prisma.lawyerProfile.findMany({
            orderBy: { lifetimeCommissionSavings: 'desc' },
            take: 10,
            include: { lawyer: { include: { user: true } } }
        });

        const recentSettlements = await prisma.contactRequest.findMany({
            where: { settlementDocStatus: 'uploaded', settlementAmount: { not: null } },
            take: 50,
            orderBy: { updatedAt: 'desc' }
        });

        const suspiciousDocs = recentSettlements.filter(r => {
            const estimate = Number(r.estimatedSeverance || 0);
            const settlement = Number(r.settlementAmount || 0);
            return estimate > 0 && (settlement / estimate) < 0.20;
        });

        res.json({
            anomalies: anomalies.map(a => ({
                id: a.id,
                lawyerName: a.lawyerProfile?.lawyer?.user?.fullName || 'Sin Asignar',
                lawyerId: a.lawyerProfile?.lawyer?.id || null,
                issue: 'Case Marked Won but No Document Uploaded'
            })),
            suspiciousDocs: suspiciousDocs.map(s => ({
                id: s.id,
                estimate: s.estimatedSeverance,
                reported: s.settlementAmount,
                flag: 'Low Settlement Ratio (<20%)'
            })),
            topEarners: topEarners.map(t => ({
                lawyer: t.lawyer?.user?.fullName,
                savings: t.lifetimeCommissionSavings,
                score: t.reputationScore
            }))
        });

    } catch (error: any) {
        console.error('Vault Compliance Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
