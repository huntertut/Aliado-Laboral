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
exports.SubscriptionService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.SubscriptionService = {
    /**
     * Check if a worker has Premium access
     */
    isWorkerPremium(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield prisma.user.findUnique({
                where: { id: userId },
                include: { workerSubscription: true }
            });
            if (!user || user.role !== 'worker')
                return false;
            // Check explicit plan field or active subscription
            if (user.plan === 'premium')
                return true;
            if (((_a = user.workerSubscription) === null || _a === void 0 ? void 0 : _a.status) === 'active') {
                // Check expiry
                if (user.workerSubscription.endDate && user.workerSubscription.endDate > new Date()) {
                    return true;
                }
            }
            return false;
        });
    },
    /**
     * Check if a lawyer has Pro access
     */
    isLawyerPro(lawyerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const lawyer = yield prisma.lawyer.findUnique({
                where: { id: lawyerId },
                include: { subscription: true }
            });
            if (!lawyer)
                return false;
            // Check subscription plan and status
            if (((_a = lawyer.subscription) === null || _a === void 0 ? void 0 : _a.plan) === 'pro' && lawyer.subscription.status === 'active') {
                if (lawyer.subscription.endDate && lawyer.subscription.endDate > new Date()) {
                    return true;
                }
            }
            return false;
        });
    },
    /**
     * Upgrade a worker to Premium (Internal Logic)
     */
    upgradeWorkerToPremium(userId, paymentDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            // This would be called after successful payment
            return prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Update User Plan
                yield tx.user.update({
                    where: { id: userId },
                    data: { plan: 'premium' }
                });
                // Update or Create Subscription
                const existingSub = yield tx.workerSubscription.findUnique({ where: { userId } });
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1); // 1 year access? Or Lifetime? Spec said "Pago Único $29". So maybe lifetime or very long. Let's say 10 years.
                endDate.setFullYear(endDate.getFullYear() + 10);
                if (existingSub) {
                    yield tx.workerSubscription.update({
                        where: { userId },
                        data: {
                            status: 'active',
                            amount: 29.00,
                            startDate: new Date(),
                            endDate: endDate,
                            paymentProvider: paymentDetails.provider,
                            lastPaymentId: paymentDetails.transactionId
                        }
                    });
                }
                else {
                    yield tx.workerSubscription.create({
                        data: {
                            userId,
                            status: 'active',
                            amount: 29.00,
                            startDate: new Date(),
                            endDate: endDate,
                            paymentProvider: paymentDetails.provider,
                            lastPaymentId: paymentDetails.transactionId
                        }
                    });
                }
            }));
        });
    }
};
