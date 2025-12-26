"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getUnlockedContact = exports.getLawyerRequests = exports.getMyRequests = exports.rejectContactRequest = exports.acceptContactRequest = exports.createContactRequestWithPayment = void 0;
const client_1 = require("@prisma/client");
const stripeService = __importStar(require("../services/stripeService"));
const mercadopagoService = __importStar(require("../services/mercadopagoService"));
const prisma = new client_1.PrismaClient();
/**
 * WORKER: Create contact request with payment gateway selection
 * NEW: Worker chooses Stripe OR MercadoPago for $50 payment
 */
const createContactRequestWithPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { lawyerProfileId, caseSummary, caseType, urgency, paymentGateway, estimatedSeverance, yearsOfService } = req.body;
        const workerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!workerId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        // Validate payment gateway
        if (!paymentGateway || !['stripe', 'mercadopago'].includes(paymentGateway)) {
            return res.status(400).json({ error: 'Método de pago inválido' });
        }
        // Verify lawyer profile exists
        const lawyerProfile = yield prisma.lawyerProfile.findUnique({
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
        const worker = yield prisma.user.findUnique({ where: { id: workerId } });
        if (!worker) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Calculate expiration (48 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);
        // Create contact request with Classification and Fee
        const contactRequest = yield prisma.contactRequest.create({
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
        // Process payment based on gateway choice
        let paymentResult;
        if (paymentGateway === 'stripe') {
            // ... (Stripe logic remains same)
            try {
                // Get or create Stripe customer
                let stripeCustomerId = worker.stripeCustomerId;
                if (!stripeCustomerId) {
                    const customer = yield stripeService.createStripeCustomer({
                        email: worker.email,
                        name: worker.fullName || undefined,
                        metadata: { userId: worker.id, role: 'worker' }
                    });
                    stripeCustomerId = customer.id;
                    // Save customer ID
                    yield prisma.user.update({
                        where: { id: workerId },
                        data: { stripeCustomerId, preferredGateway: 'stripe' }
                    });
                }
                // Charge worker $50
                const paymentIntent = yield stripeService.chargeStripeCustomer(stripeCustomerId, 50, // $50 MXN (Fixed Opening Fee)
                'MXN', `Contact fee for lawyer ${lawyerProfile.lawyer.user.fullName}`, {
                    contactRequestId: contactRequest.id,
                    userId: workerId,
                    type: 'worker_contact_fee'
                });
                paymentResult = {
                    success: true,
                    gateway: 'stripe',
                    transactionId: paymentIntent.id,
                    clientSecret: paymentIntent.client_secret,
                };
                // Update contact request with Stripe transaction
                yield prisma.contactRequest.update({
                    where: { id: contactRequest.id },
                    data: {
                        workerTransactionId: paymentIntent.id,
                        workerPaid: paymentIntent.status === 'succeeded',
                        openingFeePaid: 50.00
                    }
                });
            }
            catch (error) {
                console.error('Stripe payment error:', error);
                yield prisma.contactRequest.delete({ where: { id: contactRequest.id } });
                return res.status(500).json({ error: 'Error al procesar pago con Stripe' });
            }
        }
        else {
            // ... (MercadoPago logic remains same)
            try {
                const preference = yield mercadopagoService.createMercadoPagoPreference({
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
                yield prisma.contactRequest.update({
                    where: { id: contactRequest.id },
                    data: {
                        workerTransactionId: preference.id,
                    }
                });
                // Save MercadoPago as preferred gateway
                yield prisma.user.update({
                    where: { id: workerId },
                    data: { preferredGateway: 'mercadopago' }
                });
            }
            catch (error) {
                console.error('MercadoPago payment error:', error);
                // Delete contact request if payment failed
                yield prisma.contactRequest.delete({ where: { id: contactRequest.id } });
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
    }
    catch (error) {
        console.error('Error creating contact request:', error);
        res.status(500).json({ error: 'Error al crear solicitud' });
    }
});
exports.createContactRequestWithPayment = createContactRequestWithPayment;
/**
 * LAWYER: Accept contact request (triggers DUAL CHARGE)
 * Charges: Worker $50 (already paid) + Lawyer $150 or $300 (charged now)
 */
const acceptContactRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const lawyer = yield prisma.lawyer.findUnique({
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
        const contactRequest = yield prisma.contactRequest.findUnique({
            where: { id },
            include: { worker: true }
        });
        if (!contactRequest) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        // 2. CHECK BUSINESS RULES: HOT CASE RESTRICTION
        // Only PRO lawyers can accept HOT cases
        if (contactRequest.isHot) {
            const isPro = ((_b = lawyer.subscription) === null || _b === void 0 ? void 0 : _b.plan) === 'pro';
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
                const customer = yield stripeService.createStripeCustomer({
                    email: lawyer.user.email,
                    name: lawyer.user.fullName || undefined,
                    metadata: { lawyerId: lawyer.id, role: 'lawyer' }
                });
                stripeCustomerId = customer.id;
                yield prisma.lawyer.update({
                    where: { id: lawyer.id },
                    data: { stripeCustomerId }
                });
            }
            // Charge lawyer the dynamic amount (150 or 300)
            const feeAmount = Number(contactRequest.lawyerPaymentAmount);
            const lawyerPayment = yield stripeService.chargeStripeCustomer(stripeCustomerId, feeAmount, 'MXN', `Case acceptance fee (${contactRequest.classification}) - Contact ${contactRequest.id}`, {
                contactRequestId: contactRequest.id,
                lawyerId: lawyer.id,
            });
            if (lawyerPayment.status !== 'succeeded') {
                throw new Error('El cargo al abogado no fue exitoso');
            }
            // 3. SUCCESS / ATOMIC TRANSACTION
            // Update Request Status & Create Auto-Welcome Message
            const now = new Date();
            const [updatedRequest, initialMessage] = yield prisma.$transaction([
                // Update Contact Request
                prisma.contactRequest.update({
                    where: { id: contactRequest.id },
                    data: {
                        status: 'accepted',
                        acceptedAt: now,
                        lawyerPaid: true,
                        leadCostPaid: feeAmount,
                        bothPaymentsSucceeded: true, // Worker already paid
                        subStatus: 'chat_active', // Enable Chat
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
        }
        catch (error) {
            console.error('Lawyer payment error:', error);
            // ROLLBACK: Refund worker if lawyer payment failed
            if (contactRequest.workerPaymentGateway === 'stripe' && contactRequest.workerTransactionId) {
                yield stripeService.refundStripeCharge(contactRequest.workerTransactionId);
            }
            else if (contactRequest.workerPaymentGateway === 'mercadopago' && contactRequest.workerTransactionId) {
                yield mercadopagoService.refundMercadoPagoPayment(contactRequest.workerTransactionId);
            }
            return res.status(500).json({
                error: 'Error al procesar el cargo del abogado',
                message: 'Se reembolsó el pago del trabajador'
            });
        }
    }
    catch (error) {
        console.error('Error accepting contact request:', error);
        res.status(500).json({ error: 'Error al aceptar solicitud' });
    }
});
exports.acceptContactRequest = acceptContactRequest;
/**
 * LAWYER: Reject contact request (triggers worker refund)
 */
const rejectContactRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const lawyer = yield prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });
        if (!lawyer || !lawyer.profile) {
            return res.status(404).json({ error: 'Perfil de abogado no encontrado' });
        }
        const contactRequest = yield prisma.contactRequest.findUnique({
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
                    yield stripeService.refundStripeCharge(contactRequest.workerTransactionId);
                }
                else if (contactRequest.workerPaymentGateway === 'mercadopago') {
                    yield mercadopagoService.refundMercadoPagoPayment(contactRequest.workerTransactionId);
                }
                yield prisma.contactRequest.update({
                    where: { id },
                    data: {
                        refundStatus: 'processed',
                        refundProcessedAt: new Date(),
                    }
                });
            }
            catch (error) {
                console.error('Refund error:', error);
                // Continue with rejection even if refund fails
            }
        }
        yield prisma.contactRequest.update({
            where: { id },
            data: {
                status: 'rejected',
                rejectedAt: new Date(),
                rejectionReason: reason
            }
        });
        res.json({ message: 'Solicitud rechazada y pago reembolsado' });
    }
    catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ error: 'Error al rechazar solicitud' });
    }
});
exports.rejectContactRequest = rejectContactRequest;
// WORKER - Get my contact requests
const getMyRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const workerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!workerId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const requests = yield prisma.contactRequest.findMany({
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
    }
    catch (error) {
        console.error('Error getting requests:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
});
exports.getMyRequests = getMyRequests;
// LAWYER - Get received requests
const getLawyerRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const lawyer = yield prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });
        if (!lawyer || !lawyer.profile) {
            return res.status(404).json({ error: 'Perfil de abogado no encontrado' });
        }
        const { status } = req.query;
        const requests = yield prisma.contactRequest.findMany({
            where: Object.assign({ lawyerProfileId: lawyer.profile.id }, (status && { status: status })),
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
    }
    catch (error) {
        console.error('Error getting lawyer requests:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
});
exports.getLawyerRequests = getLawyerRequests;
// LAWYER - Get unlocked contact info (only if accepted)
const getUnlockedContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const lawyer = yield prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });
        if (!lawyer || !lawyer.profile) {
            return res.status(404).json({ error: 'Perfil de abogado no encontrado' });
        }
        const request = yield prisma.contactRequest.findUnique({
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
    }
    catch (error) {
        console.error('Error getting unlocked contact:', error);
        res.status(500).json({ error: 'Error al obtener datos de contacto' });
    }
});
exports.getUnlockedContact = getUnlockedContact;
