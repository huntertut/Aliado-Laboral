import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SubscriptionService = {
    /**
     * Check if a worker has Premium access
     */
    async isWorkerPremium(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { workerSubscription: true }
        });

        if (!user || user.role !== 'worker') return false;

        // Check explicit plan field or active subscription
        if (user.plan === 'premium') return true;

        if (user.workerSubscription?.status === 'active') {
            // Check expiry
            if (user.workerSubscription.endDate && user.workerSubscription.endDate > new Date()) {
                return true;
            }
        }

        return false;
    },

    /**
     * Check if a lawyer has Pro access
     */
    async isLawyerPro(lawyerId: string): Promise<boolean> {
        const lawyer = await prisma.lawyer.findUnique({
            where: { id: lawyerId },
            include: { subscription: true }
        });

        if (!lawyer) return false;

        // Check subscription plan and status
        if (lawyer.subscription?.plan === 'pro' && lawyer.subscription.status === 'active') {
            if (lawyer.subscription.endDate && lawyer.subscription.endDate > new Date()) {
                return true;
            }
        }

        return false;
    },

    /**
     * Upgrade a worker to Premium (Internal Logic)
     */
    async upgradeWorkerToPremium(userId: string, paymentDetails: any) {
        // This would be called after successful payment
        return prisma.$transaction(async (tx) => {
            // Update User Plan
            await tx.user.update({
                where: { id: userId },
                data: { plan: 'premium' }
            });

            // Update or Create Subscription
            const existingSub = await tx.workerSubscription.findUnique({ where: { userId } });

            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1); // 1 year access? Or Lifetime? Spec said "Pago Único $29". So maybe lifetime or very long. Let's say 10 years.
            endDate.setFullYear(endDate.getFullYear() + 10);

            if (existingSub) {
                await tx.workerSubscription.update({
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
            } else {
                await tx.workerSubscription.create({
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
        });
    }
};
