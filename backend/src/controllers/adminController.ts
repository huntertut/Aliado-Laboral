import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Re-export modularized endpoints for backwards compatibility and router integrity
export { getDashboardStats, getFinancialStats, getImpactKPIs, getFinancialHealth, getCollectiveRadar } from './adminStatsController';
export { getLawyers, verifyLawyer, getWorkers, getPymes, addStrikeToLawyer, updateUserSubscription } from './adminUserController';

export const updateAdminPassword = async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!validPassword) {
            return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
        }

        const SALT_ROUNDS = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash }
        });

        res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error updating admin password:', error);
        res.status(500).json({ error: 'Failed to update admin password' });
    }
};

export const syncFirebaseLawyers = async (req: Request, res: Response) => {
    try {
        console.log('[Admin] Starting Firebase Lawyer Sync...');
        let syncedCount = 0;
        let skippedCount = 0;
        let errorsCount = 0;

        const lawyerUsers = await prisma.user.findMany({
            where: { role: 'lawyer' },
            include: { lawyerProfile: true }
        });

        for (const user of lawyerUsers) {
            if (user.lawyerProfile) {
                skippedCount++;
                continue;
            }

            console.log(`[Admin] Fixing missing Lawyer profile for: ${user.email}`);
            try {
                await prisma.lawyer.create({
                    data: {
                        userId: user.id,
                        licenseNumber: `SYNC_${user.id.substring(0, 8)}`,
                        professionalName: user.fullName,
                        specialty: 'Pendiente de asignar',
                        status: 'PENDING',
                        isVerified: false,
                        subscriptionStatus: 'inactive'
                    }
                });
                syncedCount++;
            } catch (e) {
                console.error(`Error fixing lawyer profile for ${user.email}:`, e);
                errorsCount++;
            }
        }

        res.json({
            success: true,
            stats: { newLawyers: syncedCount, skipped: skippedCount, errors: errorsCount },
            message: `Sincronización completada. ${syncedCount} perfiles de abogado reparados.`
        });
    } catch (error) {
        console.error('Error during Firebase sync:', error);
        res.status(500).json({ error: 'Failed to sync Firebase lawyers' });
    }
};

export const getPaymentLogs = async (req: Request, res: Response) => {
    try {
        // 1. Worker Subscriptions
        const subs = await prisma.workerSubscription.findMany({
            include: { user: { select: { email: true, fullName: true } } },
            orderBy: { startDate: 'desc' },
            take: 20
        });

        const subLogs = subs.map(sub => ({
            id: sub.id,
            type: 'Subscription',
            user: sub.user.email,
            amount: 29,
            status: sub.status === 'active' ? 'success' : 'failed',
            date: sub.startDate,
            gateway: 'Stripe'
        }));

        // 2. Contact Requests
        const contacts = await prisma.contactRequest.findMany({
            include: {
                worker: { select: { email: true } },
                lawyerProfile: { include: { lawyer: { include: { user: { select: { email: true } } } } } }
            },
            where: { status: 'accepted' },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        const contactLogs = contacts.map(contact => ({
            id: contact.id,
            type: 'Contact Fee',
            user: `${contact.worker.email} & ${contact.lawyerProfile?.lawyer?.user?.email || 'N/A'}`,
            amount: 200,
            status: contact.bothPaymentsSucceeded ? 'success' : 'pending',
            date: contact.createdAt,
            gateway: 'Mixed'
        }));

        const allLogs = [...subLogs, ...contactLogs]
            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
            .slice(0, 50);

        res.json(allLogs);
    } catch (error) {
        console.error('Get payment logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

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
            bothPaymentsSucceeded: (c as any).bothPaymentsSucceeded
        }));

        res.json(formattedCases);
    } catch (error) {
        console.error('Get all cases error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

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
