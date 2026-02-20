import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as stripeService from '../services/stripeService';
import * as mercadopagoService from '../services/mercadopagoService';
import * as storageService from '../services/storageService';
import * as ocrService from '../services/ocrService'; // Import OCR
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
        // Rule: Hot if Severance > 150k OR Years > 3 (UPDATED REQUIREMENT)
        const severanceValue = Number(estimatedSeverance) || 0;
        const yearsValue = Number(yearsOfService) || 0;
        let classification = 'normal';
        let isHot = false;
        let lawyerFee = 150.00;

        if (severanceValue > 150000 || yearsValue > 3) {
            classification = 'hot';
            isHot = true;
            lawyerFee = 300.00;
        }

        // Urgency Score & Consent Tracking
        const urgencyScore = (urgency === 'high' ? 80 : 50) + (isHot ? 20 : 0);
        const consentTimestamp = new Date(); // Assumed consent given at creation time via checkbox

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
                // Legal Armor Fields
                urgencyScore,
                consentTimestamp,
                dataStatus: 'MASKED', // Default Privacy
                // SLA Initialization
                lastWorkerActivityAt: new Date(),
                subStatus: 'waiting_lawyer',
                isPaused: false
            },
            include: {
                worker: { select: { id: true, fullName: true, email: true } }
            }
        });

        // 3. TRIGGER AI ANALYSIS (Async)
        triggerAIAnalysis(contactRequest.id, caseSummary || '');

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
            include: { profile: true, subscription: true }
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
                        email: true, // Fetch masked later
                        phoneNumber: true // Fetch masked later
                    }
                },
            },
            orderBy: { createdAt: 'desc' }
        });

        // TIER STRICTNESS LOGIC & LEGAL ARMOR
        const isPro = lawyer.subscription?.plan === 'pro';

        const processedRequests = requests.map(req => {
            // Is unlocked if: (PRO or PAID) AND (User CONSENTED)
            // Note: In MVP, we might treat "Creating Request" as implicit consent, but we enforce strict check if we had the field.
            // Since we just added 'hasAcceptedDataSharing', we assume it's true for new requests or check the field.

            const isTrialView = requests.length <= 3;
            const isPaid = req.status === 'accepted' || req.bothPaymentsSucceeded;
            const hasConsent = (req.worker as any).hasAcceptedDataSharing || req.consentTimestamp != null; // Handle optional field

            // LEGAL ARMOR: Double Opt-in + Payment
            const isUnlocked = (isPro || isPaid || isTrialView) && hasConsent;

            if (isUnlocked) {
                return req; // Full access
            } else {
                // Masking for Privacy Compliance
                return {
                    ...req,
                    worker: {
                        ...req.worker,
                        email: '******** (Privado)',
                        fullName: 'Usuario Protegido',
                        phoneNumber: '******** (Privado)',
                        // Remove unmasked fields
                    },
                    upsell: !isPro, // Tell frontend to upsell PRO
                    privacyLock: !hasConsent, // Specific lock reason
                    unlockPrice: 50.00
                };
            }
        });

        res.json({ requests: processedRequests });

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
            include: { profile: true, subscription: true }
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

        // Check Trial Mode (First 3 leads free)
        const totalRequests = await prisma.contactRequest.count({
            where: { lawyerProfileId: lawyer.profile.id }
        });
        const isTrialView = totalRequests <= 3;

        const isPro = lawyer.subscription?.plan === 'pro';

        if (!request.bothPaymentsSucceeded && !isTrialView && !isPro) {
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

/**
 * LAWYER: Update CRM Status of a Lead
 */
export const updateCRMStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });

        if (!lawyer || !lawyer.profile) return res.status(404).json({ error: 'Abogado no encontrado' });

        const request = await prisma.contactRequest.findUnique({ where: { id } });
        if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });

        if (request.lawyerProfileId !== lawyer.profile.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Validate Status Enum
        const validStatuses = ['NEW', 'CONTACTED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const updatedRequest = await prisma.contactRequest.update({
            where: { id },
            data: { crmStatus: status }
        });

        res.json({ success: true, crmStatus: updatedRequest.crmStatus });

    } catch (error) {
        console.error('Error updating CRM status:', error);
        res.status(500).json({ error: 'Error actualizando estado' });
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

        // 1. Determine Rate based on CURRENT Plan
        const isPro = lawyer.subscription?.plan === 'pro' && lawyer.subscription?.status === 'active';
        const commissionRate = isPro ? 0.07 : 0.10; // 7% vs 10%

        const amount = Number(settlementAmount);
        const commissionFee = amount * commissionRate;

        // 2. Close Case & Record Debt
        const updatedRequest = await prisma.contactRequest.update({
            where: { id },
            data: {
                crmStatus: 'CLOSED_WON',
                settlementAmount: amount, // Corrected field name
                commissionRate: commissionRate,
                commissionAmount: commissionFee,
                settlementDocUrl: evidenceUrl, // Mapped to Correct Schema Field
                closedAt: new Date()
            },
            include: { worker: true } // REQUIRED to access request.worker later
        });

        // 3. Notify (Mock Invoice)
        const savingsMsg = isPro
            ? `✅ Ahorraste $${(amount * 0.03).toFixed(2)} por ser PRO.`
            : `⚠️ Tarifa 10% aplicada. (Si fueras PRO pagarías $${(amount * 0.07).toFixed(2)})`;

        res.json({
            success: true,
            message: 'Caso cerrado con éxito.',
            financials: {
                settlement: amount,
                rateApplied: `${(commissionRate * 100)}%`,
                commissionDue: commissionFee,
                note: savingsMsg
            }
        });

    } catch (error) {
        console.error('Error closing case:', error);
        res.status(500).json({ error: 'Error al cerrar caso' });
    }
};

// --- HELPER: ASYNC AI TRIGGER ---
import OpenAI from 'openai';

const triggerAIAnalysis = async (requestId: string, summary: string) => {
    // Fire and forget - don't block
    setImmediate(async () => {
        try {
            console.log(`🤖 [AI] Analyzing Request ${requestId} with Antigravity V2...`);
            let aiContent = "";

            if (!process.env.GROQ_API_KEY) {
                console.warn('⚠️ [AI] No Groq Key found. Using mock.');
                // Simulate success for demo
                const mockAI = {
                    analisis: {
                        categoria: "INDIVIDUAL",
                        subtipo: "DESPIDO_INJUSTIFICADO",
                        urgencia: 8,
                        es_hot: true
                    },
                    negocio: {
                        conteo_afectados: 1,
                        valor_estimado_grupo_mxn: 45000,
                        precio_sugerido_lead_abogado: 150
                    },
                    resumen_para_abogado: "Despido injustificado estándar. Buena oportunidad de volumen."
                };
                aiContent = JSON.stringify(mockAI);
            } else {
                // Initialize Groq client
                const groq = new OpenAI({
                    apiKey: process.env.GROQ_API_KEY,
                    baseURL: 'https://api.groq.com/openai/v1'
                });

                const prompt = `Actúa como un Consultor Legal Senior y Analista de Negocios para la plataforma "Aliado Laboral". 
                Tu misión es analizar el relato del trabajador para detectar el "Potencial de Monetización" y la "Gravedad Jurídica".

                VARIABLES DE ENTRADA:
                - Descripción del caso: "${summary}"

                REGLAS DE CLASIFICACIÓN:
                1. Si el usuario menciona: "maquinaria", "robots", "tecnología nueva", "automatización" o "cierre de línea", clasifica como "ART_439_LFT" (Indemnización especial).
                2. Si el número de afectados es > 1, clasifica como "COLECTIVO".
                3. Si la empresa es de un sector industrial, aumenta el "SCORE_HOT".

                FORMATO DE SALIDA (JSON ESTRICTO):
                {
                  "analisis": {
                    "categoria": "INDIVIDUAL" | "COLECTIVO",
                    "subtipo": "DESPIDO_INJUSTIFICADO" | "SUSTITUCION_MAQUINARIA" | "RECORTE_MASIVO",
                    "urgencia": 1 a 10,
                    "es_hot": boolean
                  },
                  "negocio": {
                    "conteo_afectados": number, // Estimado del texto, default 1
                    "valor_estimado_grupo_mxn": number, // Valor total del caso
                    "precio_sugerido_lead_abogado": number // Sugiere entre $150 y $500 MXN según valor
                  },
                  "resumen_para_abogado": "Redacta un pitch de 2 líneas resaltando por qué este caso es una gran oportunidad económica."
                }`;

                const completion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "llama3-70b-8192",
                    response_format: { type: "json_object" }
                });

                aiContent = completion.choices[0]?.message?.content || "{}";
            }

            // --- ANTIGRAVITY LOGIC V2: DYNAMIC UPDATES ---
            try {
                const result = JSON.parse(aiContent);
                const { analisis, negocio, resumen_para_abogado } = result;

                // 1. Update DB with AI Insights
                // We store the full JSON in aiSummary, but also promote key metrics
                await prisma.contactRequest.update({
                    where: { id: requestId },
                    data: {
                        aiSummary: aiContent,
                        isHot: analisis.es_hot,
                        // Map AI urgency (1-10) to DB Urgency Score (0-100)
                        urgencyScore: analisis.urgencia * 10,
                        // Update Classification if AI detects Collective/Machinery
                        classification: analisis.subtipo === 'SUSTITUCION_MAQUINARIA' ? 'machinery_439' : (analisis.es_hot ? 'hot' : 'normal'),
                        // Dynamic Pricing Engine
                        lawyerPaymentAmount: negocio.precio_sugerido_lead_abogado || 150.00
                    }
                });

                // 2. Hot Case / Special Case Notifications
                if (analisis.es_hot || analisis.categoria === 'COLECTIVO') {
                    console.log(`🔥 [ANTIGRAVITY] Hot/Collective Case Detected: ${requestId}`);

                    // Use Notification Service
                    const { sendPushNotification } = require('../services/notificationService');

                    // Filter Logic: PRO Lawyers
                    const proLawyers = await prisma.lawyer.findMany({
                        where: { subscription: { plan: 'pro' }, isVerified: true },
                        include: { user: true, subscription: true } // Explicitly include sub
                    });

                    const msgTitle = analisis.categoria === 'COLECTIVO' ? "🚨 ALERTA: Caso Colectivo Detectado" : "🔥 Nuevo Caso HOT de Alto Valor";
                    const msgBody = `${resumen_para_abogado} (Valor Est: $${negocio.valor_estimado_grupo_mxn.toLocaleString()})`;

                    for (const lawyer of proLawyers) {
                        if (lawyer.user?.id) {
                            await sendPushNotification(lawyer.user.id, msgTitle, msgBody, { requestId, type: 'HOT_LEAD' });
                        }
                    }
                }

                console.log(`✅ [AI] Advanced Analysis complete for ${requestId}`);

            } catch (parseError) {
                console.error('Error parsing AI content for Antigravity V2:', parseError);
                // Fallback: Save raw content
                await prisma.contactRequest.update({
                    where: { id: requestId },
                    data: { aiSummary: aiContent }
                });
            }

        } catch (error: any) {
            console.error('❌ [AI] Analysis failed:', error.message);
        }
    });
};

/**
 * EL PUENTE: Upload Settlement Document & Auto-Invoice
 */
export const uploadSettlementDoc = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const { fileBase64, fileName, fileType, processType } = req.body; // processType: 'CONCILIACION' | 'JUICIO'
        const userId = (req as any).user?.id;

        console.log(`[El Puente] Uploading settlement doc for Request ${requestId}`);

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { subscription: true }
        });
        if (!lawyer) return res.status(404).json({ error: 'Abogado no encontrado' });

        const request = await prisma.contactRequest.findUnique({
            where: { id: requestId },
            include: { worker: true }
        });
        if (!request) return res.status(404).json({ error: 'Caso no encontrado' });

        // 1. Process File
        const buffer = Buffer.from(fileBase64, 'base64');
        const destination = `settlements/${requestId}/${Date.now()}_${fileName}`;
        const fileUrl = await storageService.uploadBuffer(buffer, destination, fileType);

        // 2. OCR Analysis (Eye of Antigravity)
        let extractedAmount: number | null = null;
        let ocrText = "";

        // Only try OCR on images for now (PDF support requires pdf-parse usually, assuming Image for MVP)
        if (fileType.includes('image')) {
            const result = await ocrService.extractTextFromImage(buffer);
            ocrText = result.rawText;
            const details = ocrService.extractSettlementDetails(ocrText);
            extractedAmount = details.amount;
            console.log(`[El Puente] OCR Result: Found Amount $${extractedAmount}`);
        } else {
            // Fallback for PDFs or skip OCR
            console.log('[El Puente] PDF uploaded, skipping OCR for MVP');
        }

        // 3. Logic: Dynamic Commission Calculation (Antigravity v2.1)
        const isPro = lawyer.subscription?.plan === 'pro';
        const type = (processType || 'JUICIO').toUpperCase(); // Default to JUICIO if missing

        let rate = 0.05; // Default Safe Fallback

        if (isPro) {
            // PRO Rates
            rate = (type === 'CONCILIACION') ? 0.07 : 0.05; // 7% Fast / 5% Slow
        } else {
            // BASIC Rates
            rate = (type === 'CONCILIACION') ? 0.10 : 0.08; // 10% Fast / 8% Slow
        }

        let commissionAmount = 0;
        let invoiceId = null;

        if (extractedAmount && extractedAmount > 0) {
            commissionAmount = extractedAmount * rate;

            // 4. Generate Stripe Invoice
            if (lawyer.stripeCustomerId) {
                const invoice = await stripeService.createCommissionInvoice(
                    lawyer.stripeCustomerId,
                    commissionAmount,
                    `Comisión por Éxito (${(rate * 100).toFixed(0)}%) - ${type} - Caso #${requestId}`
                );
                invoiceId = invoice.id;
                console.log(`[El Puente] Invoice Created: ${invoiceId} (Rate: ${rate})`);
            }
        }

        // 5. Update Database (The Vault)
        await prisma.contactRequest.update({
            where: { id: requestId },
            data: {
                settlementDocUrl: fileUrl,
                settlementDocStatus: 'uploaded',
                settlementAmount: extractedAmount ? extractedAmount : undefined,
                commissionAmount: commissionAmount > 0 ? commissionAmount : undefined,
                commissionInvoiceId: invoiceId || undefined,
                commissionStatus: invoiceId ? 'pending' : 'not_applicable',
                crmStatus: 'CLOSED_WON' // Auto-close case
            }
        });

        // 6. Gamification: Reputation Boost & Loyalty Message (The "Feel Good" Logic)
        // Calculate Savings if PRO
        const basicRate = (type === 'CONCILIACION') ? 0.10 : 0.08;
        const currentSavings = isPro ? (extractedAmount! * (basicRate - rate)) : 0;

        await prisma.lawyerProfile.update({
            where: { lawyerId: lawyer.id },
            data: {
                reputationScore: { increment: 10 },
                successfulCases: { increment: 1 },
                lifetimeCommissionSavings: { increment: currentSavings }
            }
        });

        // RE-FETCH to get updated total savings
        const updatedProfile = await prisma.lawyerProfile.findUnique({ where: { lawyerId: lawyer.id } });
        const totalSavings = Number(updatedProfile?.lifetimeCommissionSavings || 0);

        // A. LOYALTY NOTIFICATION (LAWYER)
        if (commissionAmount > 0) {
            let messageContent = `⚖️ ¡Felicidades por la victoria, Colega!\n\nHemos procesado el documento de cierre. Se ha generado la factura de tu Comisión por Éxito ($${commissionAmount.toLocaleString()} MXN).`;

            if (isPro && currentSavings > 0) {
                messageContent += `\n\n💎 **Efecto PRO:** En este caso ahorraste **$${currentSavings.toLocaleString()}**.`;
                messageContent += `\n💰 **Ahorro Acumulado:** Tu suscripción PRO te ha ahorrado **$${totalSavings.toLocaleString()} MXN** en total.`;
            }

            messageContent += `\n\nEl link de pago está en tu correo. Al liquidarlo, se liberará el expediente digital para tu cliente.`;

            // Insert into Chat (Lawyer View)
            await prisma.chatMessage.create({
                data: {
                    requestId,
                    senderId: lawyer.userId,
                    content: messageContent,
                    type: 'system_notification'
                }
            });
        }

        // B. WORKER VALUE PROP (SOCIAL AUDIT)
        // Notify worker that "Something happened" but process is pending lawyer action
        if (request.workerId) {
            const workerMsg = `👋 Hola ${(request as any).worker?.fullName || 'Usuario'}, tu abogado ha marcado tu caso como 'Ganado' y ha subido el Convenio/Sentencia.\n\nPara que puedas descargar tu copia oficial y tener el respaldo legal, tu abogado debe completar el registro de cierre final en la plataforma.\n\n¡Felicidades por este gran paso!`;

            await prisma.chatMessage.create({
                data: {
                    requestId,
                    senderId: lawyer.userId, // System message appearing in chat
                    content: workerMsg,
                    type: 'text' // Visible to worker
                }
            });
        }

        res.json({
            success: true,
            message: 'Convenio subido correctamente. Caso cerrado con éxito.',
            ocrAnalysis: {
                amountDetected: extractedAmount,
                commissionGenerated: commissionAmount,
                savingsApplied: currentSavings
            }
        });

    } catch (error: any) {
        console.error('Error uploading settlement doc:', error);
        res.status(500).json({ error: 'Error procesando el convenio' });
    }
};
