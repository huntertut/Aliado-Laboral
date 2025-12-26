import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createPayment, cancelSubscription, getOrCreateStripeCustomer, PaymentProvider } from '../services/paymentService';

const prisma = new PrismaClient();

// Validation schema
const createSubscriptionSchema = z.object({
    paymentProvider: z.enum(['stripe', 'mercadopago']).optional().default('stripe'),
});

/**
 * Get current worker's subscription status
 */
export const getMySubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        let subscription = await prisma.workerSubscription.findUnique({
            where: { userId },
            include: {
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        // Create inactive subscription if doesn't exist
        if (!subscription) {
            subscription = await prisma.workerSubscription.create({
                data: {
                    userId,
                    status: 'inactive',
                },
                include: {
                    payments: true,
                },
            });
        }

        res.json({ subscription });
    } catch (error: any) {
        console.error('Error getting subscription:', error);
        res.status(500).json({ error: 'Error al obtener suscripción' });
    }
};

/**
 * Create/activate worker subscription ($29 MXN/month)
 */
export const createSubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const userEmail = (req as any).user?.email;

        if (!userId || !userEmail) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Validate request
        const validation = createSubscriptionSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors });
        }

        const { paymentProvider } = validation.data;

        // Check if already has active subscription
        const existing = await prisma.workerSubscription.findUnique({
            where: { userId },
        });

        if (existing && existing.status === 'active') {
            return res.status(400).json({
                error: 'Ya tienes una suscripción activa',
                subscription: existing,
            });
        }

        // Create payment
        const paymentResult = await createPayment(
            29, // $29 MXN
            'MXN',
            {
                userId,
                email: userEmail,
                type: 'subscription',
                description: 'Suscripción Mensual - Acceso Completo',
            },
            paymentProvider as PaymentProvider
        );

        if (!paymentResult.success) {
            return res.status(500).json({ error: paymentResult.error });
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month from now

        // Create or update subscription
        const subscription = await prisma.workerSubscription.upsert({
            where: { userId },
            create: {
                userId,
                status: 'active',
                startDate,
                endDate,
                paymentProvider,
                lastPaymentId: paymentResult.paymentId,
            },
            update: {
                status: 'active',
                startDate,
                endDate,
                paymentProvider,
                lastPaymentId: paymentResult.paymentId,
            },
        });

        // Record payment
        await prisma.workerSubscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                amount: 29,
                status: 'completed',
                paymentProvider,
                transactionId: paymentResult.paymentId,
            },
        });

        res.json({
            message: 'Suscripción activada exitosamente',
            subscription,
            payment: {
                clientSecret: paymentResult.clientSecret,
                initPoint: paymentResult.initPoint,
            },
        });
    } catch (error: any) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: 'Error al crear suscripción' });
    }
};

/**
 * Cancel worker subscription (stop auto-renewal)
 */
export const cancelMySubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const subscription = await prisma.workerSubscription.findUnique({
            where: { userId },
        });

        if (!subscription) {
            return res.status(404).json({ error: 'No se encontró suscripción' });
        }

        // Update subscription to stop auto-renewal
        const updated = await prisma.workerSubscription.update({
            where: { userId },
            data: {
                autoRenew: false,
                status: 'cancelled',
            },
        });

        // If there's a Stripe subscription ID, cancel it
        if (subscription.lastPaymentId && subscription.paymentProvider === 'stripe') {
            await cancelSubscription(subscription.lastPaymentId, 'stripe');
        }

        res.json({
            message: 'Suscripción cancelada. Tendrás acceso hasta la fecha de expiración.',
            subscription: updated,
        });
    } catch (error: any) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ error: 'Error al cancelar suscripción' });
    }
};

/**
 * Middleware: Check if worker has active subscription
 */
export const requireActiveSubscription = async (req: Request, res: Response, next: any) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const subscription = await prisma.workerSubscription.findUnique({
            where: { userId },
        });

        if (!subscription || subscription.status !== 'active') {
            return res.status(403).json({
                error: 'Suscripción requerida',
                message: 'Necesitas una suscripción activa para acceder a este contenido',
            });
        }

        // Check if subscription has expired
        if (subscription.endDate && subscription.endDate < new Date()) {
            await prisma.workerSubscription.update({
                where: { userId },
                data: { status: 'expired' },
            });

            return res.status(403).json({
                error: 'Suscripción expirada',
                message: 'Tu suscripción ha expirado. Renueva para continuar.',
            });
        }

        next();
    } catch (error: any) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: 'Error al verificar suscripción' });
    }
};
