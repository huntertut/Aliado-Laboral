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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
exports.processRefund = processRefund;
exports.createSubscription = createSubscription;
exports.cancelSubscription = cancelSubscription;
exports.getOrCreateStripeCustomer = getOrCreateStripeCustomer;
const stripe_1 = __importDefault(require("stripe"));
// Initialize payment providers
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-11-17.clover',
});
/**
 * Create a one-time payment
 */
function createPayment(amount_1, currency_1, metadata_1) {
    return __awaiter(this, arguments, void 0, function* (amount, currency, metadata, provider = 'stripe') {
        try {
            if (provider === 'stripe') {
                const paymentIntent = yield stripe.paymentIntents.create({
                    amount: Math.round(amount * 100), // Stripe uses cents
                    currency: currency.toLowerCase(),
                    metadata: Object.assign(Object.assign({}, metadata), { type: metadata.type }),
                    automatic_payment_methods: {
                        enabled: true,
                    },
                });
                return {
                    success: true,
                    paymentId: paymentIntent.id,
                    clientSecret: paymentIntent.client_secret || undefined,
                };
            }
            else if (provider === 'mercadopago') {
                // TEMPORARILY DISABLED - Use mercadopagoService.ts for MercadoPago
                // const preference = await mercadopago.preferences.create({
                //     items: [
                //         {
                //             title: metadata.description || 'Pago',
                //             unit_price: amount,
                //             quantity: 1,
                //             currency_id: currency.toUpperCase(),
                //         },
                //     ],
                //     payer: {
                //         email: metadata.email,
                //     },
                //     metadata: metadata,
                //     back_urls: {
                //         success: `${process.env.FRONTEND_URL}/payment/success`,
                //         failure: `${process.env.FRONTEND_URL}/payment/failure`,
                //         pending: `${process.env.FRONTEND_URL}/payment/pending`,
                //     },
                //     auto_return: 'approved',
                // });
                //
                // return {
                //     success: true,
                //     paymentId: preference.body.id,
                //     initPoint: preference.body.init_point,
                // };
                return {
                    success: false,
                    error: 'MercadoPago temporarily disabled - use mercadopagoService.ts',
                };
            }
            else {
                return {
                    success: false,
                    error: 'Invalid payment provider',
                };
            }
        }
        catch (error) {
            console.error('Payment creation error:', error);
            return {
                success: false,
                error: error.message || 'Payment creation failed',
            };
        }
    });
}
/**
 * Process a refund
 */
function processRefund(paymentId_1, amount_1) {
    return __awaiter(this, arguments, void 0, function* (paymentId, amount, provider = 'stripe') {
        try {
            if (provider === 'stripe') {
                const refund = yield stripe.refunds.create({
                    payment_intent: paymentId,
                    amount: Math.round(amount * 100), // Amount in cents
                });
                return {
                    success: true,
                    refundId: refund.id,
                };
            }
            else if (provider === 'mercadopago') {
                // TEMPORARILY DISABLED - Use mercadopagoService.ts for MercadoPago
                // const refund = await mercadopago.refund.create({
                //     payment_id: parseInt(paymentId),
                // });
                //
                // return {
                //     success: true,
                //     refundId: refund.body.id?.toString(),
                // };
                return {
                    success: false,
                    error: 'MercadoPago refund temporarily disabled',
                };
            }
            else {
                return {
                    success: false,
                    error: 'Invalid payment provider',
                };
            }
        }
        catch (error) {
            console.error('Refund processing error:', error);
            return {
                success: false,
                error: error.message || 'Refund processing failed',
            };
        }
    });
}
/**
 * Create a subscription
 */
function createSubscription(customerId_1, priceId_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceId, provider = 'stripe') {
        try {
            if (provider === 'stripe') {
                const subscription = yield stripe.subscriptions.create({
                    customer: customerId,
                    items: [{ price: priceId }],
                    expand: ['latest_invoice.payment_intent'],
                });
                return {
                    success: true,
                    paymentId: subscription.id,
                };
            }
            else if (provider === 'mercadopago') {
                // MercadoPago subscriptions work differently
                // For now, return an error - will implement if needed
                return {
                    success: false,
                    error: 'MercadoPago subscriptions not yet implemented',
                };
            }
            else {
                return {
                    success: false,
                    error: 'Invalid payment provider',
                };
            }
        }
        catch (error) {
            console.error('Subscription creation error:', error);
            return {
                success: false,
                error: error.message || 'Subscription creation failed',
            };
        }
    });
}
/**
 * Cancel a subscription
 */
function cancelSubscription(subscriptionId_1) {
    return __awaiter(this, arguments, void 0, function* (subscriptionId, provider = 'stripe') {
        try {
            if (provider === 'stripe') {
                yield stripe.subscriptions.cancel(subscriptionId);
                return { success: true };
            }
            else if (provider === 'mercadopago') {
                return {
                    success: false,
                    error: 'MercadoPago subscriptions not yet implemented',
                };
            }
            else {
                return {
                    success: false,
                    error: 'Invalid payment provider',
                };
            }
        }
        catch (error) {
            console.error('Subscription cancellation error:', error);
            return {
                success: false,
                error: error.message || 'Subscription cancellation failed',
            };
        }
    });
}
/**
 * Create or retrieve a Stripe customer
 */
function getOrCreateStripeCustomer(email, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Search for existing customer
            const customers = yield stripe.customers.list({
                email: email,
                limit: 1,
            });
            if (customers.data.length > 0) {
                return customers.data[0].id;
            }
            // Create new customer
            const customer = yield stripe.customers.create({
                email: email,
                metadata: {
                    userId: userId,
                },
            });
            return customer.id;
        }
        catch (error) {
            console.error('Error creating Stripe customer:', error);
            return null;
        }
    });
}
