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
exports.checkBothPaymentsSuccess = checkBothPaymentsSuccess;
exports.handleStripeWebhook = handleStripeWebhook;
exports.handleMercadoPagoWebhook = handleMercadoPagoWebhook;
const client_1 = require("@prisma/client");
const mercadopagoService = __importStar(require("./mercadopagoService"));
const prisma = new client_1.PrismaClient();
/**
 * CRITICAL FUNCTION: Check if both payments (worker + lawyer) have succeeded
 * This unlocks the contact/case when BOTH conditions are met
 */
function checkBothPaymentsSuccess(contactRequestId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const contactRequest = yield prisma.contactRequest.findUnique({
                where: { id: contactRequestId },
                include: {
                    worker: true,
                    lawyerProfile: {
                        include: { lawyer: true }
                    }
                },
            });
            if (!contactRequest) {
                throw new Error('Contact request not found');
            }
            // Check if BOTH payments are marked as succeeded
            if (contactRequest.workerPaid && contactRequest.lawyerPaid) {
                // UNLOCK THE CASE
                yield prisma.contactRequest.update({
                    where: { id: contactRequestId },
                    data: {
                        status: 'contact_unlocked',
                        bothPaymentsSucceeded: true,
                    },
                });
                console.log(`✅ Contact ${contactRequestId} UNLOCKED - both payments succeeded`);
                // TODO: Send notifications to both worker and lawyer
                // await notificationService.sendContactUnlocked(contactRequest);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error checking both payments:', error);
            return false;
        }
    });
}
/**
 * Handle Stripe webhook events
 */
function handleStripeWebhook(event) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Processing Stripe webhook: ${event.type}`);
            switch (event.type) {
                case 'payment_intent.succeeded':
                    yield handleStripePaymentSuccess(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    yield handleStripePaymentFailure(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    yield handleStripeSubscriptionPayment(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    yield handleStripeSubscriptionCanceled(event.data.object);
                    break;
                case 'customer.subscription.updated':
                    yield handleStripeSubscriptionUpdated(event.data.object);
                    break;
                default:
                    console.log(`Unhandled Stripe event type: ${event.type}`);
            }
        }
        catch (error) {
            console.error('Error handling Stripe webhook:', error);
            throw error;
        }
    });
}
/**
 * Handle Stripe payment success
 */
function handleStripePaymentSuccess(paymentIntent) {
    return __awaiter(this, void 0, void 0, function* () {
        const metadata = paymentIntent.metadata || {};
        const { contactRequestId, userId, type } = metadata;
        if (type === 'worker_contact_fee' && contactRequestId) {
            // Worker paid $50 via Stripe
            yield prisma.contactRequest.update({
                where: { id: contactRequestId },
                data: {
                    workerPaid: true,
                    workerTransactionId: paymentIntent.id,
                },
            });
            // Check if both payments succeeded
            yield checkBothPaymentsSuccess(contactRequestId);
        }
        else if (type === 'lawyer_case_acceptance' && contactRequestId) {
            // Lawyer paid $150 via Stripe
            yield prisma.contactRequest.update({
                where: { id: contactRequestId },
                data: {
                    lawyerPaid: true,
                    lawyerTransactionId: paymentIntent.id,
                },
            });
            // Check if both payments succeeded
            yield checkBothPaymentsSuccess(contactRequestId);
        }
        console.log(`✅ Stripe payment succeeded: ${paymentIntent.id}`);
    });
}
/**
 * Handle Stripe payment failure
 */
function handleStripePaymentFailure(paymentIntent) {
    return __awaiter(this, void 0, void 0, function* () {
        const metadata = paymentIntent.metadata || {};
        const { contactRequestId, type } = metadata;
        if (contactRequestId) {
            // Payment failed - trigger refund logic
            console.error(`❌ Stripe payment failed for contact ${contactRequestId}`);
            // TODO: Implement automatic refund of the other party's payment
            // If worker payment failed, refund lawyer
            // If lawyer payment failed, refund worker
        }
    });
}
/**
 * Handle Stripe subscription payment (lawyer bimonthly $99)
 */
function handleStripeSubscriptionPayment(invoice) {
    return __awaiter(this, void 0, void 0, function* () {
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        // Find lawyer by Stripe customer ID
        const lawyer = yield prisma.lawyer.findFirst({
            where: { stripeCustomerId: customerId },
        });
        if (lawyer) {
            // Update subscription status
            yield prisma.lawyer.update({
                where: { id: lawyer.id },
                data: {
                    subscriptionStatus: 'active',
                    subscriptionEndDate: new Date(invoice.period_end * 1000),
                },
            });
            console.log(`✅ Lawyer subscription renewed: ${lawyer.id}`);
        }
    });
}
/**
 * Handle Stripe subscription canceled
 */
function handleStripeSubscriptionCanceled(subscription) {
    return __awaiter(this, void 0, void 0, function* () {
        const customerId = subscription.customer;
        const lawyer = yield prisma.lawyer.findFirst({
            where: { stripeCustomerId: customerId },
        });
        if (lawyer) {
            yield prisma.lawyer.update({
                where: { id: lawyer.id },
                data: {
                    subscriptionStatus: 'canceled',
                },
            });
            console.log(`❌ Lawyer subscription canceled: ${lawyer.id}`);
        }
    });
}
/**
 * Handle Stripe subscription updated
 */
function handleStripeSubscriptionUpdated(subscription) {
    return __awaiter(this, void 0, void 0, function* () {
        const customerId = subscription.customer;
        const lawyer = yield prisma.lawyer.findFirst({
            where: { stripeCustomerId: customerId },
        });
        if (lawyer) {
            yield prisma.lawyer.update({
                where: { id: lawyer.id },
                data: {
                    subscriptionStatus: subscription.status,
                    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
                },
            });
            console.log(`🔄 Lawyer subscription updated: ${lawyer.id} - ${subscription.status}`);
        }
    });
}
/**
 * Handle MercadoPago webhook notifications
 */
function handleMercadoPagoWebhook(notification) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { type, paymentId } = mercadopagoService.parseMercadoPagoNotification(notification);
            console.log(`Processing MercadoPago webhook: ${type} - Payment: ${paymentId}`);
            if (type === 'payment' && paymentId) {
                const paymentStatus = yield mercadopagoService.getMercadoPagoPaymentStatus(paymentId);
                if (paymentStatus.status === 'approved') {
                    yield handleMercadoPagoPaymentSuccess(paymentStatus);
                }
                else if (paymentStatus.status === 'rejected') {
                    yield handleMercadoPagoPaymentFailure(paymentStatus);
                }
            }
        }
        catch (error) {
            console.error('Error handling MercadoPago webhook:', error);
            throw error;
        }
    });
}
/**
 * Handle MercadoPago payment success
 */
function handleMercadoPagoPaymentSuccess(payment) {
    return __awaiter(this, void 0, void 0, function* () {
        const externalReference = payment.externalReference; // This should be contactRequestId
        if (externalReference) {
            // Worker paid $50 via MercadoPago
            yield prisma.contactRequest.update({
                where: { id: externalReference },
                data: {
                    workerPaid: true,
                    workerTransactionId: payment.id.toString(),
                },
            });
            // Check if both payments succeeded
            yield checkBothPaymentsSuccess(externalReference);
            console.log(`✅ MercadoPago payment approved: ${payment.id}`);
        }
    });
}
/**
 * Handle MercadoPago payment failure
 */
function handleMercadoPagoPaymentFailure(payment) {
    return __awaiter(this, void 0, void 0, function* () {
        const externalReference = payment.externalReference;
        if (externalReference) {
            console.error(`❌ MercadoPago payment rejected for contact ${externalReference}`);
            // TODO: Notify worker and potentially refund lawyer if already charged
        }
    });
}
