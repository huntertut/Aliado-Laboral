import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SubscriptionService } from '../services/subscriptionService';

const prisma = new PrismaClient();

export const getSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;

        if (role === 'worker') {
            const isPremium = await SubscriptionService.isWorkerPremium(userId);
            const subscription = await prisma.workerSubscription.findUnique({
                where: { userId },
                include: {
                    payments: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                },
            });

            let daysRemaining = 0;
            if (subscription && subscription.endDate) {
                const diff = subscription.endDate.getTime() - new Date().getTime();
                daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }

            return res.json({
                hasSubscription: isPremium,
                plan: isPremium ? 'premium' : 'free',
                subscription,
                recentPayments: subscription?.payments || [],
                _isWorker: true
            });
        }

        if (role === 'lawyer') {
            console.log(`[getSubscriptionStatus] Fetching for lawyer with userId: ${userId}`);
            const lawyer = await prisma.lawyer.findUnique({
                where: { userId },
                include: {
                    subscription: {
                        include: {
                            payments: {
                                orderBy: { createdAt: 'desc' },
                                take: 5
                            }
                        }
                    }
                }
            });

            if (!lawyer) {
                console.warn(`[getSubscriptionStatus] Lawyer not found for userId: ${userId}`);
                return res.status(404).json({ error: 'Lawyer not found' });
            }

            const subscription = lawyer.subscription;
            console.log(`[getSubscriptionStatus] Found lawyer: ${lawyer.id}, Sub status: ${subscription?.status}, Plan: ${subscription?.plan}, EndDate: ${subscription?.endDate}`);

            const now = new Date();
            const subStatus = subscription?.status?.toLowerCase();
            const hasActiveSub = subStatus === 'active' &&
                !!subscription?.endDate &&
                new Date(subscription.endDate).getTime() > now.getTime();

            console.log(`[getSubscriptionStatus] Lawyer: ${lawyer.id}, Status: ${subStatus}, hasActiveSub: ${hasActiveSub}`);

            let daysRemaining = 0;
            if (subscription && subscription.endDate) {
                const diff = new Date(subscription.endDate).getTime() - now.getTime();
                daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }

            const responsePayload = {
                hasSubscription: hasActiveSub,
                plan: subscription?.plan || 'basic',
                subscription: subscription ? {
                    ...subscription,
                    daysRemaining,
                    isExpired: !!subscription.endDate && new Date(subscription.endDate).getTime() < now.getTime()
                } : null,
                recentPayments: subscription?.payments || [],
                _isLawyer: true
            };

            console.log(`[getSubscriptionStatus] Returning payload:`, JSON.stringify(responsePayload, null, 2));
            const finalPayload = {
                ...responsePayload,
                // Fallback for UI: if status is active and not expired, force hasSubscription true
                hasSubscription: responsePayload.hasSubscription || (subStatus === 'active' && !responsePayload.subscription?.isExpired)
            };

            return res.json(finalPayload);
        }

        return res.status(400).json({ error: 'Invalid role' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching subscription status' });
    }
};

export const upgradeSubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;
        const { paymentProvider, paymentMethodId } = req.body; // Mock data for now

        // MOCK PAYMENT PROCESSING
        const mockTransactionId = `tx_${Date.now()}`;

        if (role === 'worker') {
            await SubscriptionService.upgradeWorkerToPremium(userId, {
                provider: paymentProvider || 'stripe',
                transactionId: mockTransactionId
            });
            return res.json({ success: true, message: 'Worker upgraded to Premium', plan: 'premium' });
        }

        if (role === 'lawyer') {
            const lawyer = await prisma.lawyer.findUnique({ where: { userId } });
            if (!lawyer) return res.status(404).json({ error: 'Lawyer not found' });

            // Upgrade Logic for Lawyer (Move to Service ideally, but simple enough here for now)
            await prisma.$transaction(async (tx) => {
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 1);

                // Upsert Subscription
                const existingSub = await tx.lawyerSubscription.findUnique({ where: { lawyerId: lawyer.id } });

                // CHECK FOR DYNAMIC PROMOTIONS FROM SYSTEM CONFIG
                const promoActiveConfig = await tx.systemConfig.findUnique({ where: { key: 'PROMO_IS_ACTIVE' } });
                const promoDaysConfig = await tx.systemConfig.findUnique({ where: { key: 'PROMO_LAWYER_TRIAL_DAYS' } });

                const isPromoActive = promoActiveConfig?.value === 'true';
                const promoDays = parseInt(promoDaysConfig?.value || '0');

                if (isPromoActive && promoDays > 0) {
                    console.log(`🎁 [Upgrade] Applying Promo: ${promoDays} days free trial.`);
                    // Override EndDate for Free Trial
                    const trialEndDate = new Date();
                    trialEndDate.setDate(trialEndDate.getDate() + promoDays);

                    // Update variables
                    endDate.setTime(trialEndDate.getTime());
                }

                if (existingSub) {
                    await tx.lawyerSubscription.update({
                        where: { id: existingSub.id },
                        data: {
                            plan: 'pro',
                            status: 'active',
                            amount: isPromoActive ? 0.00 : 299.00, // Zero cost for trial entry
                            startDate: new Date(),
                            endDate: endDate,
                            paymentMethod: 'stripe',
                            lastPaymentId: mockTransactionId + (isPromoActive ? '_PROMO' : '')
                        }
                    });
                } else {
                    await tx.lawyerSubscription.create({
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
            });

            return res.json({ success: true, message: 'Lawyer upgraded to Pro', plan: 'pro' });
        }

        return res.status(400).json({ error: 'Invalid role for upgrade' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing upgrade' });
    }
}
