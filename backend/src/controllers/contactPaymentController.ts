import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as stripeService from '../services/stripeService';
import * as mercadopagoService from '../services/mercadopagoService';
import { sendPushNotification } from '../services/notificationService';
import moment from 'moment';

const prisma = new PrismaClient();

/**
 * LAWYER: Accept contact request (triggers DUAL CHARGE)
 * Charges: Worker $50 (already paid) + Lawyer $150 or $300 (charged now)
 */
export const acceptContactRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: {
                profile: true,
                user: true,
                subscription: true
            }
        });

        if (!lawyer || !lawyer.profile) {
            return res.status(404).json({ error: 'Perfil de abogado no encontrado' });
        }

        // Verify active subscription
        if (lawyer.subscriptionStatus !== 'active') { // Should check subscription endDate too
            return res.status(403).json({
                error: 'Necesitas una suscripción activa para aceptar solicitudes'
            });
        }

        const contactRequest = await prisma.contactRequest.findUnique({
            where: { id },
            include: { worker: true }
        });

        if (!contactRequest) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        // 1.5. CHECK MONTHLY LIMITS (Fair Use Policy)
        const startOfMonth = moment().startOf('month').toDate();
        const endOfMonth = moment().endOf('month').toDate();
        
        const acceptedThisMonth = await prisma.contactRequest.count({
            where: {
                lawyerProfileId: lawyer.profile.id,
                status: 'accepted',
                acceptedAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        const planLimit = lawyer.subscription?.plan === 'pro' ? 30 : 5;
        if (acceptedThisMonth >= planLimit) {
            return res.status(403).json({
                error: 'Límite mensual alcanzado',
                message: `Has alcanzado tu límite de ${planLimit} casos mensuales para el plan ${lawyer.subscription?.plan?.toUpperCase() || 'BÁSICO'}. ${lawyer.subscription?.plan === 'pro' ? 'Contacta a soporte para extender tu límite de uso justo.' : 'Actualiza a Plan PRO para aceptar hasta 30 casos.'}`,
                limitReached: true
            });
        }

        // 2. CHECK BUSINESS RULES: HOT CASE RESTRICTION
        // Only PRO lawyers can accept HOT cases
        if (contactRequest.isHot) {
            const isPro = lawyer.subscription?.plan === 'pro';
            if (!isPro) {
                return res.status(403).json({
                    error: 'Este caso es clasificado como HOT (Alta Prioridad).',
                    message: 'Solo abogados con Plan PRO pueden aceptar Casos Hot. Actualiza tu plan para aceptar este caso.',
                    upgradeRequired: true
                });
            }
        }

        // 3. EL PUENTE: GAMIFICATION GUARD (Overdue Commissions)
        // Check if lawyer has unpaid Success Fees > 5 days
        if (lawyer.stripeCustomerId) {
            const hasOverdue = await stripeService.checkOverdueInvoices(lawyer.stripeCustomerId);
            if (hasOverdue) {
                return res.status(402).json({
                    error: 'Bloqueo por Comisiones Pendientes',
                    message: 'Tienes facturas de "Comisión por Éxito" vencidas. Paga tus comisiones pendientes para desbloquear el acceso a nuevos leads.',
                    paymentRequired: true,
                    blockReason: 'overdue_commission'
                });
            }
        }

        if (contactRequest.lawyerProfileId !== lawyer.profile.id) {
            if (contactRequest.lawyerProfileId !== null) {
                return res.status(403).json({ error: 'No autorizado' });
            }
            if (contactRequest.previousLawyerIds) {
                const prevIds = contactRequest.previousLawyerIds.split(',').map(id => id.trim());
                if (prevIds.includes(lawyer.profile.id)) {
                    return res.status(403).json({ error: 'No autorizado: ya has atendido o dejado expirar este caso anteriormente.' });
                }
            }
        }

        if (contactRequest.status !== 'pending') {
            return res.status(400).json({ error: 'Esta solicitud ya fue procesada' });
        }

        // CRITICAL: Check if worker already paid (with on-demand Stripe verification fallback)
        if (!contactRequest.workerPaid) {
            if (contactRequest.workerPaymentGateway === 'stripe' && contactRequest.workerTransactionId) {
                try {
                    const pi = await stripeService.retrievePaymentIntent(contactRequest.workerTransactionId);
                    if (pi.status === 'succeeded') {
                        contactRequest.workerPaid = true;
                        await prisma.contactRequest.update({
                            where: { id: contactRequest.id },
                            data: { workerPaid: true }
                        });
                        console.log(`Verified Stripe Payment Intent ${contactRequest.workerTransactionId} succeeded. Marked as paid.`);
                    }
                } catch (stripeError) {
                    console.error('Failed to verify worker stripe payment intent:', stripeError);
                }
            }
        }

        if (!contactRequest.workerPaid) {
            return res.status(400).json({
                error: 'El trabajador aún no ha completado el pago',
                message: 'Esperando confirmación de pago del trabajador'
            });
        }

        // CHARGE LAWYER $150 via Stripe (lawyers ALWAYS use Stripe)
        try {
            // Get or create Stripe customer for lawyer
            let stripeCustomerId = lawyer.stripeCustomerId;
            if (!stripeCustomerId) {
                const customer = await stripeService.createStripeCustomer({
                    email: lawyer.user.email,
                    name: lawyer.user.fullName || undefined,
                    metadata: { lawyerId: lawyer.id, role: 'lawyer' }
                });
                stripeCustomerId = customer.id;

                await prisma.lawyer.update({
                    where: { id: lawyer.id },
                    data: { stripeCustomerId }
                });
            }

            // Charge lawyer the dynamic amount (150 or 300)
            const feeAmount = Number(contactRequest.lawyerPaymentAmount);

            const lawyerPayment = await stripeService.chargeStripeCustomer(
                stripeCustomerId,
                feeAmount,
                'MXN',
                `Case acceptance fee (${contactRequest.classification}) - Contact ${contactRequest.id}`,
                {
                    contactRequestId: contactRequest.id,
                    lawyerId: lawyer.id,
                },
                true // confirmAuto = true (off-session auto charge)
            );

            if (lawyerPayment.status !== 'succeeded') {
                throw new Error('El cargo al abogado no fue exitoso');
            }

            // 3. SUCCESS / ATOMIC TRANSACTION
            // Update Request Status & Create Auto-Welcome Message
            const now = new Date();

            // 🔒 COMMISSION FREEZE: Snapshot the rate at the moment of acceptance
            // This ensures plan upgrades do NOT retroactively lower the rate on this case
            const isPro = lawyer.subscription?.plan === 'pro' && lawyer.subscription?.status === 'active';
            const snapshotCommissionRate = isPro ? 0.07 : 0.10; // 7% PRO / 10% BASIC

            const [updatedRequest, initialMessage] = await prisma.$transaction([
                // Update Contact Request
                prisma.contactRequest.update({
                    where: { id: contactRequest.id },
                    data: {
                        lawyerProfileId: lawyer.profile.id,
                        status: 'accepted',
                        acceptedAt: now,
                        lawyerPaid: true,
                        leadCostPaid: feeAmount,
                        bothPaymentsSucceeded: true, // Worker already paid
                        subStatus: 'chat_active',    // Enable Chat
                        lastLawyerActivityAt: now,
                        // 🔒 FREEZE the commission rate at acceptance time
                        commissionRate: snapshotCommissionRate,
                        commissionStatus: 'pending',
                        // Update Chat Optimization Fields
                        lastMessageAt: now,
                        lastMessageContent: '¡Hola! He aceptado tu solicitud. ¿En qué puedo ayudarte?',
                        lastMessageSenderId: lawyer.userId,
                        unreadCountWorker: 1, // Worker sees 1 new message
                    }
                }),
                // Create Auto-Welcome Message
                prisma.chatMessage.create({
                    data: {
                        requestId: contactRequest.id,
                        senderId: lawyer.userId,
                        content: '¡Hola! He aceptado tu solicitud. ¿En qué puedo ayudarte?',
                        createdAt: now
                    }
                })
            ]);

            // 🔔 PUSH NOTIFICATION: Notificar al trabajador que su caso fue aceptado
            const lawyerName = lawyer.user?.fullName || lawyer.professionalName || 'Tu abogado';
            sendPushNotification(
                contactRequest.workerId,
                '✅ ¡Caso Aceptado!',
                `${lawyerName} aceptó tu solicitud. El chat ya está disponible.`,
                { type: 'case_accepted', requestId: contactRequest.id }
            ).catch(err => console.error('[Push] Error notifying worker on accept:', err));

            res.json({
                message: 'Caso aceptado. Chat habilitado.',
                contactUnlocked: true,
                paymentStatus: {
                    worker: true,
                    lawyer: true
                },
                chatId: updatedRequest.id
            });

        } catch (error: any) {
            console.error('Lawyer payment error:', error);

            // ROLLBACK: Refund worker if lawyer payment failed
            if (contactRequest.workerPaymentGateway === 'stripe' && contactRequest.workerTransactionId) {
                await stripeService.refundStripeCharge(contactRequest.workerTransactionId);
            } else if (contactRequest.workerPaymentGateway === 'mercadopago' && contactRequest.workerTransactionId) {
                await mercadopagoService.refundMercadoPagoPayment(contactRequest.workerTransactionId);
            }

            return res.status(500).json({
                error: 'Error al procesar el cargo del abogado',
                message: 'Se reembolsó el pago del trabajador'
            });
        }

    } catch (error: any) {
        console.error('Error accepting contact request:', error);
        res.status(500).json({ error: 'Error al aceptar solicitud' });
    }
};

/**
 * 💰 CLOSE CASE & CALCULATE COMMISSION (The "Rate Hike" Enforcement)
 * Logic: Checks ACTIVE plan at moment of closing.
 * PRO -> 7%
 * BASIC -> 10%
 */
export const closeCaseWithCommission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { settlementAmount, evidenceUrl } = req.body; // e.g., 100000
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true, subscription: true }
        });

        if (!lawyer || !lawyer.profile) return res.status(404).json({ error: 'Abogado no encontrado' });

        // 🔒 COMMISSION FREEZE: Read the rate that was snapshotted at acceptance time
        // This prevents plan upgrades from retroactively lowering the commission on existing cases
        const existingCase = await prisma.contactRequest.findUnique({ where: { id } });
        if (!existingCase) return res.status(404).json({ error: 'Caso no encontrado' });

        const commissionRate = existingCase.commissionRate
            ? Number(existingCase.commissionRate)
            : (lawyer.subscription?.plan === 'pro' && lawyer.subscription?.status === 'active' ? 0.07 : 0.10);

        const amount = Number(settlementAmount);
        const commissionFee = amount * commissionRate;
        const frozenAtAcceptance = existingCase.commissionRate != null;

        // 2. Close Case & Record Debt
        const updatedRequest = await prisma.contactRequest.update({
            where: { id },
            data: {
                crmStatus: 'CLOSED_WON',
                settlementAmount: amount,
                commissionAmount: commissionFee,
                settlementDocUrl: evidenceUrl,
                closedAt: new Date()
                // Note: commissionRate is NOT updated here — it was frozen at acceptance
            },
            include: { worker: true }
        });

        // 3. Response
        res.json({
            success: true,
            message: 'Caso cerrado con éxito.',
            financials: {
                settlement: amount,
                rateApplied: `${(commissionRate * 100).toFixed(0)}%`,
                commissionDue: commissionFee,
                rateFrozenAt: frozenAtAcceptance ? 'aceptación del caso' : 'cierre del caso',
                note: frozenAtAcceptance
                    ? `✅ Tasa congelada al momento de aceptar: ${(commissionRate * 100).toFixed(0)}%.`
                    : `ℹ️ Tasa aplicada según plan actual: ${(commissionRate * 100).toFixed(0)}%.`
            }
        });

    } catch (error) {
        console.error('Error closing case:', error);
        res.status(500).json({ error: 'Error al cerrar caso' });
    }
};
