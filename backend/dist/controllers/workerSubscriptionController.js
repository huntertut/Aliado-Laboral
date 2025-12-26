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
exports.requireActiveSubscription = exports.cancelMySubscription = exports.createSubscription = exports.getMySubscription = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const paymentService_1 = require("../services/paymentService");
const prisma = new client_1.PrismaClient();
// Validation schema
const createSubscriptionSchema = zod_1.z.object({
    paymentProvider: zod_1.z.enum(['stripe', 'mercadopago']).optional().default('stripe'),
});
/**
 * Get current worker's subscription status
 */
const getMySubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        let subscription = yield prisma.workerSubscription.findUnique({
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
            subscription = yield prisma.workerSubscription.create({
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
    }
    catch (error) {
        console.error('Error getting subscription:', error);
        res.status(500).json({ error: 'Error al obtener suscripción' });
    }
});
exports.getMySubscription = getMySubscription;
/**
 * Create/activate worker subscription ($29 MXN/month)
 */
const createSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userEmail = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
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
        const existing = yield prisma.workerSubscription.findUnique({
            where: { userId },
        });
        if (existing && existing.status === 'active') {
            return res.status(400).json({
                error: 'Ya tienes una suscripción activa',
                subscription: existing,
            });
        }
        // Create payment
        const paymentResult = yield (0, paymentService_1.createPayment)(29, // $29 MXN
        'MXN', {
            userId,
            email: userEmail,
            type: 'subscription',
            description: 'Suscripción Mensual - Acceso Completo',
        }, paymentProvider);
        if (!paymentResult.success) {
            return res.status(500).json({ error: paymentResult.error });
        }
        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month from now
        // Create or update subscription
        const subscription = yield prisma.workerSubscription.upsert({
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
        yield prisma.workerSubscriptionPayment.create({
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
    }
    catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: 'Error al crear suscripción' });
    }
});
exports.createSubscription = createSubscription;
/**
 * Cancel worker subscription (stop auto-renewal)
 */
const cancelMySubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const subscription = yield prisma.workerSubscription.findUnique({
            where: { userId },
        });
        if (!subscription) {
            return res.status(404).json({ error: 'No se encontró suscripción' });
        }
        // Update subscription to stop auto-renewal
        const updated = yield prisma.workerSubscription.update({
            where: { userId },
            data: {
                autoRenew: false,
                status: 'cancelled',
            },
        });
        // If there's a Stripe subscription ID, cancel it
        if (subscription.lastPaymentId && subscription.paymentProvider === 'stripe') {
            yield (0, paymentService_1.cancelSubscription)(subscription.lastPaymentId, 'stripe');
        }
        res.json({
            message: 'Suscripción cancelada. Tendrás acceso hasta la fecha de expiración.',
            subscription: updated,
        });
    }
    catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ error: 'Error al cancelar suscripción' });
    }
});
exports.cancelMySubscription = cancelMySubscription;
/**
 * Middleware: Check if worker has active subscription
 */
const requireActiveSubscription = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const subscription = yield prisma.workerSubscription.findUnique({
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
            yield prisma.workerSubscription.update({
                where: { userId },
                data: { status: 'expired' },
            });
            return res.status(403).json({
                error: 'Suscripción expirada',
                message: 'Tu suscripción ha expirado. Renueva para continuar.',
            });
        }
        next();
    }
    catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: 'Error al verificar suscripción' });
    }
});
exports.requireActiveSubscription = requireActiveSubscription;
