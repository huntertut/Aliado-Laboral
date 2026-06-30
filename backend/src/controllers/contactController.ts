import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as stripeService from '../services/stripeService';
import * as mercadopagoService from '../services/mercadopagoService';
import * as storageService from '../services/storageService';
import { sendPushNotification } from '../services/notificationService';
import moment from 'moment';
import { addBusinessDays } from '../utils/businessDays';
import OpenAI from 'openai';

const prisma = new PrismaClient();

// Re-export modularized endpoints for backwards compatibility and router integrity
export { acceptContactRequest, closeCaseWithCommission } from './contactPaymentController';
export { uploadSettlementDoc, suggestReply } from './contactVaultController';
export { getRequestInfo, reassignLawyer, archiveInactiveCase } from './contactSlaController';

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

        // Calculate expiration (3 business days from now)
        const expiresAt = addBusinessDays(new Date(), 3);

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
 * LAWYER: Reject contact request (triggers worker refund)
 */
export const rejectContactRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true, user: true }
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

        // 🔔 PUSH NOTIFICATION: Notificar al trabajador que su solicitud fue rechazada
        const lawyerDisplayName = lawyer.user?.fullName || lawyer.professionalName || 'El abogado';
        sendPushNotification(
            contactRequest.workerId,
            '❌ Solicitud No Aceptada',
            `${lawyerDisplayName} no pudo aceptar tu solicitud en este momento. Se procesó tu reembolso.`,
            { type: 'case_rejected', requestId: id }
        ).catch(err => console.error('[Push] Error notifying worker on reject:', err))

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
        const profileId = lawyer.profile.id;

        const requests = await prisma.contactRequest.findMany({
            where: {
                OR: [
                    { lawyerProfileId: profileId },
                    {
                        lawyerProfileId: null,
                        status: 'pending'
                    }
                ],
                ...(status && { status: status as string })
            },
            include: {
                worker: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true
                    }
                },
            },
            orderBy: { createdAt: 'desc' }
        });

        // Filter out cases where this lawyer abandoned or rejected it previously
        const filteredRequests = requests.filter(req => {
            if (req.previousLawyerIds) {
                const prevIds = req.previousLawyerIds.split(',').map(id => id.trim());
                if (prevIds.includes(profileId)) {
                    return false;
                }
            }
            return true;
        });

        // TIER STRICTNESS LOGIC & LEGAL ARMOR
        const isPro = lawyer.subscription?.plan === 'pro'
            && lawyer.subscription?.status === 'active'
            && (lawyer.subscription?.endDate ? lawyer.subscription.endDate > new Date() : false);

        // \ud83d\udd25 HOT CASE FILTER: Pro plan only sees hot cases, Basic only sees normal cases
        const tierFilteredRequests = filteredRequests.filter(req => {
            if (req.isHot) return isPro; // Hot cases → only Pro abogados
            return true; // Normal cases → any active subscription (or trial)
        });

        const processedRequests = tierFilteredRequests.map(req => {
            const isTrialView = tierFilteredRequests.length <= 3;
            const isPaid = req.status === 'accepted' || req.bothPaymentsSucceeded;
            const hasConsent = (req.worker as any).hasAcceptedDataSharing || req.consentTimestamp != null;

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
                    },
                    upsell: !isPro, // Tell frontend to upsell PRO
                    privacyLock: !hasConsent, // Specific lock reason
                    unlockPrice: 50.00
                };
            }
        });

        res.json({ requests: processedRequests, isPro }); // send isPro to frontend for upsell UI


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
            include: { profile: true, subscription: true }
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
            data: { crmStatus: status },
            include: { worker: true }
        });

        // 🔔 PUSH NOTIFICATION: Notificar al trabajador del avance de su caso
        const crmStatusMessages: Record<string, { title: string; body: string }> = {
            'NEW':         { title: '📋 Tu caso está en revisión', body: 'Tu abogado está revisando los detalles de tu caso.' },
            'CONTACTED':   { title: '📞 Tu abogado te ha contactado', body: 'Tu abogado marcó el inicio del contacto contigo.' },
            'NEGOTIATING': { title: '🤝 Fase de Negociación', body: 'Tu caso ha entrado en fase de negociación. Mantente atento al chat.' },
            'CLOSED_WON':  { title: '🏆 ¡Caso Ganado/Conciliado!', body: 'Tu abogado marcó tu caso como resuelto favorablemente. ¡Felicidades!' },
            'CLOSED_LOST': { title: '📁 Caso Cerrado', body: 'Tu abogado cerró tu caso. Puedes contactarlo para más detalles.' }
        };

        const pushMsg = crmStatusMessages[status];
        if (pushMsg && updatedRequest.worker?.id) {
            sendPushNotification(
                updatedRequest.worker.id,
                pushMsg.title,
                pushMsg.body,
                { type: 'case_status_update', requestId: id, crmStatus: status }
            ).catch(err => console.error('[Push] Error notifying worker on CRM update:', err));
        }

        // NOTIFICACIÓN AL ADMIN SI ES GANADO (El Puente)
        if (status === 'CLOSED_WON' || status === 'CLOSED_LOST') {
            if (status === 'CLOSED_WON') {
                const rate = lawyer.subscription?.plan === 'pro' ? '5% o 7%' : '8% o 10%';
                await prisma.adminAlert.create({
                    data: {
                        type: 'success_fee_pending',
                        message: `El abogado ${lawyer.id} marcó el caso ${id} como GANADO/CONCILIADO. Es necesario contactarlo para el cobro manual de la comisión por éxito (${rate}).`,
                        severity: 'high',
                        relatedUserId: lawyer.userId
                    }
                });
            }
        }

        res.json({ success: true, crmStatus: updatedRequest.crmStatus });

    } catch (error) {
        console.error('Error updating CRM status:', error);
        res.status(500).json({ error: 'Error actualizando estado' });
    }
};

// --- HELPER: ASYNC AI TRIGGER ---
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
                await prisma.contactRequest.update({
                    where: { id: requestId },
                    data: {
                        aiSummary: aiContent,
                        isHot: analisis.es_hot,
                        urgencyScore: analisis.urgencia * 10,
                        classification: analisis.subtipo === 'SUSTITUCION_MAQUINARIA' ? 'machinery_439' : (analisis.es_hot ? 'hot' : 'normal'),
                        lawyerPaymentAmount: negocio.precio_sugerido_lead_abogado || 150.00
                    }
                });

                // 2. Hot Case / Special Case Notifications
                if (analisis.es_hot || analisis.categoria === 'COLECTIVO') {
                    console.log(`🔥 [ANTIGRAVITY] Hot/Collective Case Detected: ${requestId}`);

                    const proLawyers = await prisma.lawyer.findMany({
                        where: { subscription: { plan: 'pro' }, isVerified: true },
                        include: { user: true, subscription: true }
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
