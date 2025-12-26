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
exports.createStripeCustomer = createStripeCustomer;
exports.chargeStripeCustomer = chargeStripeCustomer;
exports.createStripeSubscription = createStripeSubscription;
exports.attachPaymentMethod = attachPaymentMethod;
exports.refundStripeCharge = refundStripeCharge;
exports.cancelStripeSubscription = cancelStripeSubscription;
exports.getStripeCustomer = getStripeCustomer;
exports.getStripeSubscription = getStripeSubscription;
exports.verifyStripeWebhookSignature = verifyStripeWebhookSignature;
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-11-17.clover', // Cast to avoid TS strict check if logic doesn't depend on it
    typescript: true,
});
/**
 * Create a Stripe customer (for lawyers and workers who choose Stripe)
 */
function createStripeCustomer(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const customer = yield stripe.customers.create({
                email: data.email,
                name: data.name,
                metadata: data.metadata || {},
            });
            return customer;
        }
        catch (error) {
            console.error('Error creating Stripe customer:', error);
            throw new Error(`Stripe customer creation failed: ${error.message}`);
        }
    });
}
/**
 * Charge a Stripe customer (one-time payment)
 */
function chargeStripeCustomer(customerId_1, amount_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, amount, currency = 'MXN', description = 'Payment', metadata) {
        try {
            const paymentIntent = yield stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                customer: customerId,
                description,
                metadata: metadata || {},
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never', // For automatic charges
                },
            });
            return paymentIntent;
        }
        catch (error) {
            console.error('Error charging Stripe customer:', error);
            throw new Error(`Stripe charge failed: ${error.message}`);
        }
    });
}
/**
 * Create a Stripe subscription (for lawyers - $99 bimonthly)
 */
function createStripeSubscription(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const subscription = yield stripe.subscriptions.create({
                customer: data.customerId,
                items: [{ price: data.priceId }],
                metadata: data.metadata || {},
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
            });
            return subscription;
        }
        catch (error) {
            console.error('Error creating Stripe subscription:', error);
            throw new Error(`Stripe subscription creation failed: ${error.message}`);
        }
    });
}
/**
 * Attach a payment method to a customer
 */
function attachPaymentMethod(paymentMethodId, customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const paymentMethod = yield stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });
            // Set as default payment method
            yield stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
            return paymentMethod;
        }
        catch (error) {
            console.error('Error attaching payment method:', error);
            throw new Error(`Payment method attachment failed: ${error.message}`);
        }
    });
}
/**
 * Refund a Stripe charge
 */
function refundStripeCharge(paymentIntentId, amount, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const refundData = {
                payment_intent: paymentIntentId,
                reason: reason || 'requested_by_customer',
            };
            if (amount) {
                refundData.amount = Math.round(amount * 100);
            }
            const refund = yield stripe.refunds.create(refundData);
            return refund;
        }
        catch (error) {
            console.error('Error refunding Stripe charge:', error);
            throw new Error(`Stripe refund failed: ${error.message}`);
        }
    });
}
/**
 * Cancel a Stripe subscription
 */
function cancelStripeSubscription(subscriptionId_1) {
    return __awaiter(this, arguments, void 0, function* (subscriptionId, immediately = false) {
        try {
            if (immediately) {
                return yield stripe.subscriptions.cancel(subscriptionId);
            }
            else {
                return yield stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true,
                });
            }
        }
        catch (error) {
            console.error('Error canceling Stripe subscription:', error);
            throw new Error(`Stripe subscription cancellation failed: ${error.message}`);
        }
    });
}
/**
 * Get Stripe customer by ID
 */
function getStripeCustomer(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const customer = yield stripe.customers.retrieve(customerId);
            return customer;
        }
        catch (error) {
            console.error('Error retrieving Stripe customer:', error);
            throw new Error(`Stripe customer retrieval failed: ${error.message}`);
        }
    });
}
/**
 * Get Stripe subscription by ID
 */
function getStripeSubscription(subscriptionId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const subscription = yield stripe.subscriptions.retrieve(subscriptionId);
            return subscription;
        }
        catch (error) {
            console.error('Error retrieving Stripe subscription:', error);
            throw new Error(`Stripe subscription retrieval failed: ${error.message}`);
        }
    });
}
/**
 * Verify Stripe webhook signature
 */
function verifyStripeWebhookSignature(payload, signature) {
    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        return event;
    }
    catch (error) {
        console.error('Error verifying Stripe webhook signature:', error);
        throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
}
exports.default = stripe;
