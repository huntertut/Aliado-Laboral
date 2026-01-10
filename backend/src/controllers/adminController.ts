import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as storageService from '../services/storageService';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. Total Income (Month)
        // This is a placeholder. In a real app, you'd sum up actual payments from Stripe/MercadoPago logs or a Payment model.
        // For now, we'll estimate based on subscriptions and contacts.
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Count active subscriptions (Workers)
        const activeWorkerSubs = await prisma.workerSubscription.count({
            where: { status: 'active' }
        });

        // Count active subscriptions (Lawyers)
        const activeLawyerSubs = await prisma.lawyerSubscription.count({
            where: { status: 'active' }
        });

        // Count contacts sold this month
        const contactsSold = await prisma.contactRequest.count({
            where: {
                createdAt: { gte: startOfMonth },
                status: 'accepted', // Assuming accepted means paid/successful for now
                bothPaymentsSucceeded: true
            }
        });

        // Calculate estimated income (simplified)
        // Worker Sub: $29, Lawyer Sub: $99/2mo (~$50/mo), Contact: $50 (worker) + $150 (lawyer) = $200? Or commission?
        // Let's assume platform revenue is:
        // - Worker Sub: $29
        // - Lawyer Sub: $50 (monthly avg)
        // - Contact: $50 (worker fee) + maybe commission from lawyer fee? 
        // Let's stick to the prompt's "Ingresos Totales" breakdown.

        const incomeSubscriptions = (activeWorkerSubs * 29) + (activeLawyerSubs * 50);
        const incomeContacts = contactsSold * 50; // Worker pays $50 platform fee
        const incomeCommissions = 0; // Placeholder for won cases commissions

        const totalIncome = incomeSubscriptions + incomeContacts + incomeCommissions;

        // 2. Active Users
        const activeLawyers = await prisma.lawyer.count({
            where: { isVerified: true } // Active = Verified
        });

        // 3. Conversion Rate
        const totalRequests = await prisma.contactRequest.count({
            where: { createdAt: { gte: startOfMonth } }
        });
        const conversionRate = totalRequests > 0 ? (contactsSold / totalRequests) * 100 : 0;

        // 4. Action Items
        const pendingLawyers = await prisma.lawyer.count({
            where: { isVerified: false }
        });

        const failedPayments = 0; // Placeholder until Payment model is fully populated
        const suspiciousActivity = await prisma.adminAlert.count({
            where: { isResolved: false, severity: 'high' }
        });

        // 5. Recent Activity (Last 24h)
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const recentPayments = await prisma.contactRequest.count({
            where: {
                status: 'accepted',
                bothPaymentsSucceeded: true,
                acceptedAt: { gte: oneDayAgo }
            }
        });

        res.json({
            kpis: {
                totalIncome,
                incomeBreakdown: {
                    subscriptions: incomeSubscriptions,
                    contacts: incomeContacts,
                    commissions: incomeCommissions
                },
                activeUsers: {
                    lawyers: activeLawyers,
                    workers: activeWorkerSubs
                },
                contactsSold,
                conversionRate: Math.round(conversionRate * 100) / 100 // 2 decimals
            },
            actionItems: {
                pendingLawyers,
                failedPayments,
                suspiciousActivity,
                recentPayments // New field
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getLawyers = async (req: Request, res: Response) => {
    try {
        const lawyers = await prisma.lawyer.findMany({
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        createdAt: true
                    }
                },
                subscription: true
            },
            orderBy: { user: { createdAt: 'desc' } }
        });

        // Format for frontend
        const formattedLawyers = lawyers.map(lawyer => {
            const l = lawyer as any;
            return {
                id: l.id,
                userId: l.userId,
                fullName: l.user.fullName,
                email: l.user.email,
                isVerified: l.isVerified,
                licenseNumber: l.licenseNumber,
                subscriptionStatus: l.subscriptionStatus || 'inactive',
                createdAt: l.user.createdAt
            };
        });

        res.json(formattedLawyers);
    } catch (error) {
        console.error('Get lawyers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyLawyer = async (req: Request, res: Response) => {
    try {
        const { lawyerId } = req.params;
        const { isVerified } = req.body;

        const lawyer = await prisma.lawyer.update({
            where: { id: lawyerId },
            data: { isVerified }
        });

        // Log activity
        // await prisma.activityLog.create(...)

        res.json(lawyer);
    } catch (error) {
        console.error('Verify lawyer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getWorkers = async (req: Request, res: Response) => {
    try {
        // Workers are Users with role 'worker'
        const workers = await prisma.user.findMany({
            where: { role: 'worker' },
            include: {
                workerSubscription: true,
                _count: {
                    select: { contactRequestsSent: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedWorkers = workers.map(worker => ({
            id: worker.id,
            fullName: worker.fullName,
            email: worker.email,
            subscriptionStatus: worker.workerSubscription?.status || 'free',
            contactRequests: worker._count.contactRequestsSent,
            createdAt: worker.createdAt
        }));

        res.json(formattedWorkers);
    } catch (error) {
        console.error('Get workers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPymes = async (req: Request, res: Response) => {
    try {
        const pymes = await prisma.user.findMany({
            where: { role: 'pyme' },
            include: {
                pymeProfile: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedPymes = pymes.map(pyme => ({
            id: pyme.id,
            fullName: pyme.fullName, // Often acts as Contact Name
            companyName: pyme.pymeProfile?.razonSocial || 'Sin Razón Social',
            email: pyme.email,
            plan: pyme.plan || 'basic',
            subscriptionLevel: pyme.subscriptionLevel || 'basic',
            industry: pyme.pymeProfile?.industry || 'N/A',
            createdAt: pyme.createdAt
        }));

        res.json(formattedPymes);
    } catch (error) {
        console.error('Get pymes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getFinancialStats = async (req: Request, res: Response) => {
    try {
        const { range } = req.query; // 'today', 'week', 'month', 'year', 'all'

        // Date filtering logic could be added here
        // For MVP, we return total all-time stats and current month

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // 1. Subscriptions Revenue
        const workerSubs = await prisma.workerSubscription.findMany({
            where: { status: 'active' } // Simplified: assuming active means paid recently
        });
        const workerRevenue = workerSubs.length * 29; // $29 fixed price

        // 2. Contact Revenue
        const paidContacts = await prisma.contactRequest.findMany({
            where: {
                status: 'accepted',
                bothPaymentsSucceeded: true
            }
        });
        const contactRevenue = paidContacts.length * 200; // $50 (worker) + $150 (lawyer)

        // 3. Total
        const totalRevenue = workerRevenue + contactRevenue;

        res.json({
            totalRevenue,
            breakdown: {
                subscriptions: workerRevenue,
                contacts: contactRevenue,
                commissions: 0
            },
            period: 'All Time (Estimated)'
        });
    } catch (error) {
        console.error('Get financial stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPaymentLogs = async (req: Request, res: Response) => {
    try {
        // Aggregate logs from different sources

        // 1. Worker Subscriptions (Simulated logs based on active subs)
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
            gateway: 'Stripe' // Default for now
        }));

        // 2. Contact Requests (Simulated logs)
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
            user: `${contact.worker.email} & ${contact.lawyerProfile.lawyer.user.email}`,
            amount: 200,
            status: contact.bothPaymentsSucceeded ? 'success' : 'pending',
            date: contact.createdAt,
            gateway: 'Mixed'
        }));

        // Merge and sort
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
            lawyerName: c.lawyerProfile.lawyer.user.fullName,
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
        const logs = await prisma.activityLog.findMany({
            include: { user: { select: { email: true, role: true } } },
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

        // Verify if case is "ready" for purge (accepted and both payments succeeded)
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

        await storageService.purgeContactRequestData(requestId);

        // Log admin activity
        await prisma.activityLog.create({
            data: {
                userId: (req as any).user?.id,
                action: 'purge_case_data',
                details: `Purged data for Request ID: ${requestId}`,
                createdAt: new Date()
            }
        });

        res.json({ success: true, message: 'Datos purgados correctamente por políticas de privacidad' });
    } catch (error) {
        console.error('Purge case data error:', error);
        res.status(500).json({ error: 'Error al purgar los datos' });
    }
};
