import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as stripeService from '../services/stripeService';
import * as mercadopagoService from '../services/mercadopagoService';
import * as storageService from '../services/storageService';
import { checkBothPaymentsSuccess } from '../services/webhookHandlerService';

const prisma = new PrismaClient();

/**
 * WORKER: Create contact request with payment gateway selection
 * NEW: Worker chooses Stripe OR MercadoPago for $50 payment
 */
export const createContactRequestWithPayment = async (req: Request, res: Response) => {
    try {
        const { lawyerProfileId, caseSummary, caseType, urgency, paymentGateway, estimatedSeverance, yearsOfService, documents } = req.body;
        const workerId = (req as any).user?.id;

        if (!workerId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // Validate payment gateway
        if (!paymentGateway || !['stripe', 'mercadopago'].includes(paymentGateway)) {
            return res.status(400).json({ error: 'Método de pago inválido' });
        }

        // Verify lawyer profile exists
        const lawyerProfile = await prisma.lawyerProfile.findUnique({
            where: { id: lawyerProfileId },
            include: {
                lawyer: { include: { user: true, subscription: true } }
            }
        });

        if (!lawyerProfile) {
            return res.status(404).json({ error: 'Abogado no encontrado' });
        }

        const lawyer = lawyerProfile.lawyer;

        // 1. CLASSIFY CASE (Normal vs Hot)
        // Rule: Hot if Severance > 50k OR Years > 3
        const severanceValue = Number(estimatedSeverance) || 0;
        const yearsValue = Number(yearsOfService) || 0;
        let classification = 'normal';
        let isHot = false;
        let lawyerFee = 150.00;

        if (severanceValue > 50000 || yearsValue > 3) {
            classification = 'hot';
            isHot = true;
            lawyerFee = 300.00;
        }

        // Get or create worker as customer
        const worker = await prisma.user.findUnique({ where: { id: workerId } });
        if (!worker) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Calculate expiration (48 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        // Create contact request with Classification and Fee
        const contactRequest = await prisma.contactRequest.create({
            data: {
                workerId,
                lawyerProfileId,
                caseSummary,
                caseType,
                urgency: urgency || 'normal',
                status: 'pending',
                workerPaymentGateway: paymentGateway,
                expiresAt,
                // Business Model Fields
                classification,
                isHot,
                lawyerPaymentAmount: lawyerFee,
                // SLA Initialization
                lastWorkerActivityAt: new Date(),
                subStatus: 'waiting_lawyer',
                isPaused: false
            },
            include: {
                worker: { select: { id: true, fullName: true, email: true } }
            }
        });

        // 2. PROCESS DOCUMENTS (if provided)
        if (documents && Array.isArray(documents)) {
            console.log(`📂 [createContactRequest] Procesando ${documents.length} documentos...`);
            for (const doc of documents) {
                try {
                    const buffer = Buffer.from(doc.base64, 'base64');
                    const extension = doc.type.split('/')[1] || 'bin';
                    const destination = `requests/${contactRequest.id}/doc_${Date.now()}_${doc.name.replace(/\s+/g, '_')}`;

                    const fileUrl = await storageService.uploadBuffer(buffer, destination, doc.type);

                    await prisma.requestDocument.create({
                        data: {
                            requestId: contactRequest.id,
                            fileName: doc.name,
                            fileUrl,
                            fileType: extension,
                            fileSize: doc.size || buffer.length
                        }
                    });
                } catch (docError) {
                    console.error('❌ Error subiendo documento:', docError);
                    // Continue with other documents
                }
            }
        }

        // Process payment based on gateway choice
        let paymentResult: any;

        if (paymentGateway === 'stripe') {
            // ... (Stripe logic remains same)
            try {
                // Get or create Stripe customer
                let stripeCustomerId = worker.stripeCustomerId;
                if (!stripeCustomerId) {
                    const customer = await stripeService.createStripeCustomer({
                        email: worker.email,
                        name: worker.fullName || undefined,
                        metadata: { userId: worker.id, role: 'worker' }
                    });
                    stripeCustomerId = customer.id;

                    // Save customer ID
                    await prisma.user.update({
                        where: { id: workerId },
                        data: { stripeCustomerId, preferredGateway: 'stripe' }
                    });
                }

                // Charge worker $50
                const paymentIntent = await stripeService.chargeStripeCustomer(
                    stripeCustomerId,
                    50, // $50 MXN (Fixed Opening Fee)
                    'MXN',
                    `Contact fee for lawyer ${lawyerProfile.lawyer.user.fullName}`,
                    {
                        contactRequestId: contactRequest.id,
                        userId: workerId,
                        type: 'worker_contact_fee'
                    }
                );

                paymentResult = {
                    success: true,
                    gateway: 'stripe',
                    transactionId: paymentIntent.id,
                    clientSecret: paymentIntent.client_secret,
                };

                // Update contact request with Stripe transaction
                await prisma.contactRequest.update({
                    where: { id: contactRequest.id },
                    data: {
                        workerTransactionId: paymentIntent.id,
                        workerPaid: paymentIntent.status === 'succeeded',
                        openingFeePaid: 50.00
                    }
                });

            } catch (error: any) {
                console.error('Stripe payment error:', error);
                await prisma.contactRequest.delete({ where: { id: contactRequest.id } });
                return res.status(500).json({ error: 'Error al procesar pago con Stripe' });
            }

        } else {
            // ... (MercadoPago logic remains same)
            try {
                const preference = await mercadopagoService.createMercadoPagoPreference({
                    amount: 50,
                    description: `Contactar abogado - ${lawyerProfile.lawyer.user.fullName}`,
                    email: worker.email,
                    externalReference: contactRequest.id,
                    metadata: {
                        contactRequestId: contactRequest.id,
                        userId: workerId,
                        type: 'worker_contact_fee'
                    }
                });

                paymentResult = {
                    success: true,
                    gateway: 'mercadopago',
                    preferenceId: preference.id,
                    initPoint: preference.initPoint,
                };

                // Update contact request with MP preference ID
                await prisma.contactRequest.update({
                    where: { id: contactRequest.id },
                    data: {
                        workerTransactionId: preference.id,
                    }
                });

                // Save MercadoPago as preferred gateway
                await prisma.user.update({
                    where: { id: workerId },
                    data: { preferredGateway: 'mercadopago' }
                });

            } catch (error: any) {
                console.error('MercadoPago payment error:', error);
                // Delete contact request if payment failed
                await prisma.contactRequest.delete({ where: { id: contactRequest.id } });
                return res.status(500).json({ error: 'Error al procesar pago con MercadoPago' });
            }
        }

        res.status(201).json({
            message: 'Solicitud creada. Completa el pago para enviarla.',
            contactRequest: {
                id: contactRequest.id,
                status: contactRequest.status,
                classification: contactRequest.classification, // Show frontend the logic
                lawyerFee: lawyerFee, // Internal info, nice to know
                expiresAt: contactRequest.expiresAt,
            },
            payment: paymentResult,
        });

    } catch (error: any) {
        console.error('Error creating contact request:', error);
        res.status(500).json({ error: 'Error al crear solicitud' });
    }
};

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

        if (contactRequest.lawyerProfileId !== lawyer.profile.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (contactRequest.status !== 'pending') {
            return res.status(400).json({ error: 'Esta solicitud ya fue procesada' });
        }

        // CRITICAL: Check if worker already paid
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
                }
            );

            if (lawyerPayment.status !== 'succeeded') {
                throw new Error('El cargo al abogado no fue exitoso');
            }

            // 3. SUCCESS / ATOMIC TRANSACTION
            // Update Request Status & Create Auto-Welcome Message
            const now = new Date();

            const [updatedRequest, initialMessage] = await prisma.$transaction([
                // Update Contact Request
                prisma.contactRequest.update({
                    where: { id: contactRequest.id },
                    data: {
                        status: 'accepted',
                        acceptedAt: now,
                        lawyerPaid: true,
                        leadCostPaid: feeAmount,
                        bothPaymentsSucceeded: true, // Worker already paid
                        subStatus: 'chat_active',    // Enable Chat
                        lastLawyerActivityAt: now,
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
 * LAWYER: Reject contact request (triggers worker refund)
 */
export const rejectContactRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });

        if (!lawyer || !lawyer.profile) {
            return res.status(404).json({ error: 'Perfil de abogado no encontrado' });
        }

        const contactRequest = await prisma.contactRequest.findUnique({
            where: { id }
        });

        if (!contactRequest) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (contactRequest.lawyerProfileId !== lawyer.profile.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (contactRequest.status !== 'pending') {
            return res.status(400).json({ error: 'Esta solicitud ya fue procesada' });
        }

        // REFUND WORKER if they already paid
        if (contactRequest.workerPaid && contactRequest.workerTransactionId) {
            try {
                if (contactRequest.workerPaymentGateway === 'stripe') {
                    await stripeService.refundStripeCharge(contactRequest.workerTransactionId);
                } else if (contactRequest.workerPaymentGateway === 'mercadopago') {
                    await mercadopagoService.refundMercadoPagoPayment(contactRequest.workerTransactionId);
                }

                await prisma.contactRequest.update({
                    where: { id },
                    data: {
                        refundStatus: 'processed',
                        refundProcessedAt: new Date(),
                    }
                });
            } catch (error: any) {
                console.error('Refund error:', error);
                // Continue with rejection even if refund fails
            }
        }

        await prisma.contactRequest.update({
            where: { id },
            data: {
                status: 'rejected',
                rejectedAt: new Date(),
                rejectionReason: reason
            }
        });

        res.json({ message: 'Solicitud rechazada y pago reembolsado' });

    } catch (error: any) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ error: 'Error al rechazar solicitud' });
    }
};

// WORKER - Get my contact requests
export const getMyRequests = async (req: Request, res: Response) => {
    try {
        const workerId = (req as any).user?.id;

        if (!workerId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const requests = await prisma.contactRequest.findMany({
            where: { workerId },
            include: {
                lawyerProfile: {
                    include: {
                        lawyer: {
                            include: {
                                user: { select: { fullName: true } }
                            }
                        }
                    }
                },
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ requests });

    } catch (error: any) {
        console.error('Error getting requests:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
};

// LAWYER - Get received requests
export const getLawyerRequests = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });

        if (!lawyer || !lawyer.profile) {
            return res.status(404).json({ error: 'Perfil de abogado no encontrado' });
        }

        const { status } = req.query;

        const requests = await prisma.contactRequest.findMany({
            where: {
                lawyerProfileId: lawyer.profile.id,
                ...(status && { status: status as string })
            },
            include: {
                worker: {
                    select: {
                        id: true,
                        fullName: true,
                    }
                },
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ requests });

    } catch (error: any) {
        console.error('Error getting lawyer requests:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
};

// LAWYER - Get unlocked contact info (only if accepted)
export const getUnlockedContact = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });

        if (!lawyer || !lawyer.profile) {
            return res.status(404).json({ error: 'Perfil de abogado no encontrado' });
        }

        const request = await prisma.contactRequest.findUnique({
            where: { id },
            include: {
                worker: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (request.lawyerProfileId !== lawyer.profile.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (!request.bothPaymentsSucceeded) {
            return res.status(403).json({
                error: 'Debes completar el pago para ver los datos de contacto'
            });
        }

        res.json({
            contactInfo: {
                worker: request.worker,
                phone: lawyer.profile.phone,
                whatsapp: lawyer.profile.whatsapp,
                caseSummary: request.caseSummary,
            }
        });

    } catch (error: any) {
        console.error('Error getting unlocked contact:', error);
        res.status(500).json({ error: 'Error al obtener datos de contacto' });
    }
};
