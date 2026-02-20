
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { SubscriptionService } from '../services/subscriptionService';

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any, // Use installed version or safe default
});

// PRICE MAP (Hardcoded for simplicity matching Frontend)
const PRICES: Record<string, number> = {
    'worker_premium': 2900, // $29.00 MXN
    'lawyer_basic': 9900,   // $99.00 MXN
    'lawyer_pro': 29900,    // $299.00 MXN
    'pyme_pro': 99900       // $999.00 MXN
};

export const activateSubscription = async (req: Request, res: Response) => {
    try {
        const { planType, paymentMethod } = req.body;
        const userId = (req as any).user.userId;
        const role = (req as any).user.role;

        if (!planType || !PRICES[planType]) {
            return res.status(400).json({ error: 'Invalid Plan Type' });
        }

        const amount = PRICES[planType];

        // 1. Get or Create Stripe Customer
        let customerId: string | null = null;
        let userEmail: string = '';

        // Fetch User and relevant Profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { lawyerProfile: true } // Check relation name
        });

        if (!user) return res.status(404).json({ error: 'User not found' });
        userEmail = user.email;

        if (role === 'lawyer') {
            const lawyer = await prisma.lawyer.findUnique({ where: { userId } });
            if (lawyer?.stripeCustomerId) {
                customerId = lawyer.stripeCustomerId;
            }
        } else {
            // Worker or Pyme
            if (user.stripeCustomerId) {
                customerId = user.stripeCustomerId;
            }
        }

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: { userId, role }
            });
            customerId = customer.id;

            // Save Customer ID
            if (role === 'lawyer') {
                await prisma.lawyer.update({
                    where: { userId },
                    data: { stripeCustomerId: customerId }
                });
            } else {
                await prisma.user.update({
                    where: { id: userId },
                    data: { stripeCustomerId: customerId }
                });
            }
        }

        // 2. Create Ephemeral Key (Required for Mobile SDK)
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customerId },
            { apiVersion: '2022-11-15' } // Often hardcoded to match SDK version, or retrieve from client
        );

        // 3. Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'mxn',
            customer: customerId,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId,
                planType,
                role
            }
        });

        res.json({
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customerId,
            paymentIntentId: paymentIntent.id
        });

    } catch (error: any) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
};

export const confirmPayment = async (req: Request, res: Response) => {
    try {
        const { paymentIntentId } = req.body;
        const userId = (req as any).user.userId;

        if (!paymentIntentId) return res.status(400).json({ error: 'Missing paymentIntentId' });

        // Verify with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment not successful yet' });
        }

        // Extract metadata
        const planType = paymentIntent.metadata.planType;
        const role = paymentIntent.metadata.role;

        // Start Transaction to update DB
        await prisma.$transaction(async (tx) => {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // 30 Days default

            if (role === 'worker') {
                // Update User Plan
                await tx.user.update({ where: { id: userId }, data: { plan: 'premium' } });

                // Upsert Subscription
                const existing = await tx.workerSubscription.findUnique({ where: { userId } });
                if (existing) {
                    await tx.workerSubscription.update({
                        where: { userId },
                        data: {
                            status: 'active',
                            endDate,
                            amount: new Date().getTime() % 2 === 0 ? 29 : 29, // Hack, use Decimal properly
                            lastPaymentId: paymentIntent.id,
                            paymentProvider: 'stripe'
                        }
                    });
                } else {
                    await tx.workerSubscription.create({
                        data: {
                            userId,
                            status: 'active',
                            endDate,
                            amount: 29,
                            lastPaymentId: paymentIntent.id,
                            paymentProvider: 'stripe'
                        }
                    });
                }

            } else if (role === 'lawyer') {
                const lawyer = await tx.lawyer.findUnique({ where: { userId } });
                if (!lawyer) throw new Error('Lawyer not found');

                const planName = planType === 'lawyer_pro' ? 'pro' : 'basic';
                const amount = planName === 'pro' ? 299 : 99;

                const existing = await tx.lawyerSubscription.findUnique({ where: { lawyerId: lawyer.id } });

                if (existing) {
                    await tx.lawyerSubscription.update({
                        where: { id: existing.id },
                        data: {
                            status: 'active',
                            plan: planName,
                            endDate,
                            amount,
                            lastPaymentId: paymentIntent.id,
                            paymentMethod: 'stripe'
                        }
                    });
                } else {
                    await tx.lawyerSubscription.create({
                        data: {
                            lawyerId: lawyer.id,
                            status: 'active',
                            plan: planName,
                            endDate,
                            amount,
                            lastPaymentId: paymentIntent.id,
                            paymentMethod: 'stripe'
                        }
                    });
                }
            } else if (role === 'pyme') {
                // Update Pyme User Fields
                // Note: Schema stores subscriptionLevel on User or PymeProfile?
                // User model has `subscriptionLevel`.
                const level = planType === 'pyme_pro' ? 'premium' : 'basic';

                await tx.user.update({
                    where: { id: userId },
                    data: { subscriptionLevel: level, planExpiresAt: endDate }
                });
            }
        });

        res.json({ success: true });

    } catch (error: any) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ error: error.message });
    }
};

export const activateFreeSubscription = async (req: Request, res: Response) => {
    try {
        const { planType } = req.body;
        const userId = (req as any).user.userId;
        const role = (req as any).user.role;

        if (role === 'pyme' && planType === 'pyme_basic') {
            // Activate Basic Pyme (Free)
            await prisma.user.update({
                where: { id: userId },
                data: { subscriptionLevel: 'basic', planExpiresAt: null } // No expiry or unlimited
            });
            return res.json({ success: true });
        }

        if (role === 'worker' && planType === 'free') {
            // Revert to free
            await prisma.user.update({
                where: { id: userId },
                data: { plan: 'free' } // No expiry or unlimited
            });
            // Cancel sub logic...
            return res.json({ success: true });
        }

        res.status(400).json({ error: 'Invalid free plan request' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to activate free plan' });
    }
};

export const cancelAutoRenew = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const role = (req as any).user.role;

        if (role === 'worker') {
            await prisma.workerSubscription.update({
                where: { userId },
                data: { autoRenew: false }
            });
        } else if (role === 'lawyer') {
            const lawyer = await prisma.lawyer.findUnique({ where: { userId } });
            if (lawyer) {
                await prisma.lawyerSubscription.update({
                    where: { lawyerId: lawyer.id },
                    data: { autoRenew: false }
                });
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel' });
    }
};

export const getSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const role = (req as any).user.role;

        // --- DEV BYPASS FOR TEST ACCOUNTS ---
        // Fetch email to check if it's a test account
        const userCheck = await prisma.user.findUnique({ where: { id: userId } });
        const email = userCheck?.email?.toLowerCase() || '';

        if (email === 'lawyer_pro@test.com') {
            return res.json({
                hasSubscription: true,
                plan: 'pro',
                subscription: {
                    status: 'active',
                    plan: 'pro',
                    daysRemaining: 30, // Fixed
                    isExpired: false,
                    endDate: new Date(Date.now() + 86400000 * 30),
                    autoRenew: true
                },
                recentPayments: [],
                _isDevBypass: true
            });
        }
        if (email === 'pyme_premium@test.com') {
            return res.json({
                hasSubscription: true,
                plan: 'pro',
                subscription: {
                    status: 'active',
                    daysRemaining: 30,
                    isExpired: false,
                    autoRenew: true
                },
                _isDevBypass: true
            });
        }
        if (email === 'worker_premium@test.com') {
            return res.json({
                hasSubscription: true,
                plan: 'premium',
                subscription: {
                    status: 'active',
                    daysRemaining: 30,
                    isExpired: false
                },
                recentPayments: [],
                _isWorker: true,
                _isDevBypass: true
            });
        }
        // ------------------------------------

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
                subscription: subscription ? {
                    ...subscription,
                    daysRemaining,
                    isExpired: daysRemaining === 0
                } : null,
                recentPayments: subscription?.payments || [],
                _isWorker: true
            });
        }

        if (role === 'lawyer') {
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
                return res.status(404).json({ error: 'Lawyer not found' });
            }

            const subscription = lawyer.subscription;

            // Logic validation
            const now = new Date();
            const hasActiveSub = subscription?.status === 'active' &&
                subscription.endDate &&
                subscription.endDate > now;

            let daysRemaining = 0;
            if (subscription && subscription.endDate) {
                const diff = subscription.endDate.getTime() - now.getTime();
                daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }

            return res.json({
                hasSubscription: hasActiveSub,
                plan: subscription?.plan || 'basic',
                subscription: subscription ? {
                    ...subscription,
                    daysRemaining,
                    isExpired: !hasActiveSub
                } : null,
                recentPayments: subscription?.payments || []
            });
        }

        if (role === 'pyme') {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            const plan = user?.subscriptionLevel || 'basic'; // basic, premium
            const isPremium = plan === 'premium'; // pyme_pro is premium

            // Mock subscription object for frontend
            return res.json({
                hasSubscription: isPremium,
                plan: isPremium ? 'pro' : 'basic',
                subscription: {
                    status: 'active',
                    daysRemaining: isPremium ? 30 : 999, // infinite for basic
                    isExpired: false,
                    autoRenew: false
                }
            });
        }

        return res.status(400).json({ error: 'Invalid role' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching subscription status' });
    }
};

export const upgradeSubscription = async (req: Request, res: Response) => {
    // Deprecated or redirect to activate logic
    res.status(400).json({ error: 'Use /activate endpoint' });
};
