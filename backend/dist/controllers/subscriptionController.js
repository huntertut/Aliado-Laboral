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
exports.upgradeSubscription = exports.getSubscriptionStatus = void 0;
const client_1 = require("@prisma/client");
const subscriptionService_1 = require("../services/subscriptionService");
const prisma = new client_1.PrismaClient();
const getSubscriptionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        if (role === 'worker') {
            const isPremium = yield subscriptionService_1.SubscriptionService.isWorkerPremium(userId);
            const subscription = yield prisma.workerSubscription.findUnique({
                where: { userId }
            });
            let daysRemaining = 0;
            if (subscription && subscription.endDate) {
                const diff = subscription.endDate.getTime() - new Date().getTime();
                daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }
            return res.json({
                hasSubscription: isPremium,
                plan: isPremium ? 'premium' : 'free',
                subscription: subscription ? Object.assign(Object.assign({}, subscription), { daysRemaining, isExpired: !isPremium && !!subscription.endDate && subscription.endDate < new Date() }) : null
            });
        }
        if (role === 'lawyer') {
            const lawyer = yield prisma.lawyer.findUnique({ where: { userId } });
            if (!lawyer)
                return res.status(404).json({ error: 'Lawyer not found' });
            const isPro = yield subscriptionService_1.SubscriptionService.isLawyerPro(lawyer.id);
            const subscription = yield prisma.lawyerSubscription.findUnique({
                where: { lawyerId: lawyer.id }
            });
            let daysRemaining = 0;
            if (subscription && subscription.endDate) {
                const diff = subscription.endDate.getTime() - new Date().getTime();
                daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }
            return res.json({
                hasSubscription: isPro,
                plan: isPro ? 'pro' : 'basic',
                subscription: subscription ? Object.assign(Object.assign({}, subscription), { daysRemaining, isExpired: !isPro && !!subscription.endDate && subscription.endDate < new Date() }) : null
            });
        }
        return res.status(400).json({ error: 'Invalid role' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching subscription status' });
    }
});
exports.getSubscriptionStatus = getSubscriptionStatus;
const upgradeSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { paymentProvider, paymentMethodId } = req.body; // Mock data for now
        // MOCK PAYMENT PROCESSING
        const mockTransactionId = `tx_${Date.now()}`;
        if (role === 'worker') {
            yield subscriptionService_1.SubscriptionService.upgradeWorkerToPremium(userId, {
                provider: paymentProvider || 'stripe',
                transactionId: mockTransactionId
            });
            return res.json({ success: true, message: 'Worker upgraded to Premium', plan: 'premium' });
        }
        if (role === 'lawyer') {
            const lawyer = yield prisma.lawyer.findUnique({ where: { userId } });
            if (!lawyer)
                return res.status(404).json({ error: 'Lawyer not found' });
            // Upgrade Logic for Lawyer (Move to Service ideally, but simple enough here for now)
            yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 1);
                // Upsert Subscription
                const existingSub = yield tx.lawyerSubscription.findUnique({ where: { lawyerId: lawyer.id } });
                if (existingSub) {
                    yield tx.lawyerSubscription.update({
                        where: { id: existingSub.id },
                        data: {
                            plan: 'pro',
                            status: 'active',
                            amount: 299.00,
                            startDate: new Date(),
                            endDate: endDate,
                            paymentMethod: 'stripe',
                            lastPaymentId: mockTransactionId
                        }
                    });
                }
                else {
                    yield tx.lawyerSubscription.create({
                        data: {
                            lawyerId: lawyer.id,
                            plan: 'pro',
                            status: 'active',
                            amount: 299.00,
                            startDate: new Date(),
                            endDate: endDate,
                            paymentMethod: 'stripe',
                            lastPaymentId: mockTransactionId
                        }
                    });
                }
            }));
            return res.json({ success: true, message: 'Lawyer upgraded to Pro', plan: 'pro' });
        }
        return res.status(400).json({ error: 'Invalid role for upgrade' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing upgrade' });
    }
});
exports.upgradeSubscription = upgradeSubscription;
