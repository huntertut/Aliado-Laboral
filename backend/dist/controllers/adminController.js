"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAlert = exports.getAdminAlerts = exports.getSecurityLogs = exports.getAllCases = exports.getPaymentLogs = exports.getFinancialStats = exports.getWorkers = exports.verifyLawyer = exports.getLawyers = exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Total Income (Month)
        // This is a placeholder. In a real app, you'd sum up actual payments from Stripe/MercadoPago logs or a Payment model.
        // For now, we'll estimate based on subscriptions and contacts.
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        // Count active subscriptions (Workers)
        const activeWorkerSubs = yield prisma.workerSubscription.count({
            where: { status: 'active' }
        });
        // Count active subscriptions (Lawyers)
        const activeLawyerSubs = yield prisma.lawyerSubscription.count({
            where: { status: 'active' }
        });
        // Count contacts sold this month
        const contactsSold = yield prisma.contactRequest.count({
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
        const activeLawyers = yield prisma.lawyer.count({
            where: { isVerified: true } // Active = Verified
        });
        // 3. Conversion Rate
        const totalRequests = yield prisma.contactRequest.count({
            where: { createdAt: { gte: startOfMonth } }
        });
        const conversionRate = totalRequests > 0 ? (contactsSold / totalRequests) * 100 : 0;
        // 4. Action Items
        const pendingLawyers = yield prisma.lawyer.count({
            where: { isVerified: false }
        });
        const failedPayments = 0; // Placeholder until Payment model is fully populated
        const suspiciousActivity = yield prisma.adminAlert.count({
            where: { isResolved: false, severity: 'high' }
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
                suspiciousActivity
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getDashboardStats = getDashboardStats;
const getLawyers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lawyers = yield prisma.lawyer.findMany({
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
            const l = lawyer;
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
    }
    catch (error) {
        console.error('Get lawyers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getLawyers = getLawyers;
const verifyLawyer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lawyerId } = req.params;
        const { isVerified } = req.body;
        const lawyer = yield prisma.lawyer.update({
            where: { id: lawyerId },
            data: { isVerified }
        });
        // Log activity
        // await prisma.activityLog.create(...)
        res.json(lawyer);
    }
    catch (error) {
        console.error('Verify lawyer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.verifyLawyer = verifyLawyer;
const getWorkers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Workers are Users with role 'worker'
        const workers = yield prisma.user.findMany({
            where: { role: 'worker' },
            include: {
                workerSubscription: true,
                _count: {
                    select: { contactRequestsSent: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const formattedWorkers = workers.map(worker => {
            var _a;
            return ({
                id: worker.id,
                fullName: worker.fullName,
                email: worker.email,
                subscriptionStatus: ((_a = worker.workerSubscription) === null || _a === void 0 ? void 0 : _a.status) || 'free',
                contactRequests: worker._count.contactRequestsSent,
                createdAt: worker.createdAt
            });
        });
        res.json(formattedWorkers);
    }
    catch (error) {
        console.error('Get workers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getWorkers = getWorkers;
const getFinancialStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { range } = req.query; // 'today', 'week', 'month', 'year', 'all'
        // Date filtering logic could be added here
        // For MVP, we return total all-time stats and current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        // 1. Subscriptions Revenue
        const workerSubs = yield prisma.workerSubscription.findMany({
            where: { status: 'active' } // Simplified: assuming active means paid recently
        });
        const workerRevenue = workerSubs.length * 29; // $29 fixed price
        // 2. Contact Revenue
        const paidContacts = yield prisma.contactRequest.findMany({
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
    }
    catch (error) {
        console.error('Get financial stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getFinancialStats = getFinancialStats;
const getPaymentLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Aggregate logs from different sources
        // 1. Worker Subscriptions (Simulated logs based on active subs)
        const subs = yield prisma.workerSubscription.findMany({
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
        const contacts = yield prisma.contactRequest.findMany({
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
    }
    catch (error) {
        console.error('Get payment logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getPaymentLogs = getPaymentLogs;
const getAllCases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cases = yield prisma.contactRequest.findMany({
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
            createdAt: c.createdAt
        }));
        res.json(formattedCases);
    }
    catch (error) {
        console.error('Get all cases error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllCases = getAllCases;
const getSecurityLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield prisma.activityLog.findMany({
            include: { user: { select: { email: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(logs);
    }
    catch (error) {
        console.error('Get security logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getSecurityLogs = getSecurityLogs;
const getAdminAlerts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const alerts = yield prisma.adminAlert.findMany({
            orderBy: [
                { isResolved: 'asc' },
                { createdAt: 'desc' }
            ],
            take: 20
        });
        res.json(alerts);
    }
    catch (error) {
        console.error('Get admin alerts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAdminAlerts = getAdminAlerts;
const resolveAlert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { alertId } = req.params;
        const alert = yield prisma.adminAlert.update({
            where: { id: alertId },
            data: { isResolved: true, resolvedAt: new Date() }
        });
        res.json(alert);
    }
    catch (error) {
        console.error('Resolve alert error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.resolveAlert = resolveAlert;
