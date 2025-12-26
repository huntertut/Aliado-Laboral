import Stripe from 'stripe';
import mercadopago from 'mercadopago';

// Initialize payment providers
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-11-17.clover' as any,
});

// TEMPORARILY DISABLED - Use mercadopagoService.ts instead
// mercadopago.configure({
//     access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
// });

export type PaymentProvider = 'stripe' | 'mercadopago';

interface PaymentMetadata {
    userId: string;
    email: string;
    type: 'subscription' | 'contact';
    description?: string;
}

interface PaymentResult {
    success: boolean;
    paymentId?: string;
    error?: string;
    clientSecret?: string; // For Stripe frontend confirmation
    initPoint?: string; // For MercadoPago redirect
}

interface RefundResult {
    success: boolean;
    refundId?: string;
    error?: string;
}

/**
 * Create a one-time payment
 */
export async function createPayment(
    amount: number,
    currency: string,
    metadata: PaymentMetadata,
    provider: PaymentProvider = 'stripe'
): Promise<PaymentResult> {
    try {
        if (provider === 'stripe') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe uses cents
                currency: currency.toLowerCase(),
                metadata: {
                    ...metadata,
                    type: metadata.type,
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            return {
                success: true,
                paymentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret || undefined,
            };
        } else if (provider === 'mercadopago') {
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
        } else {
            return {
                success: false,
                error: 'Invalid payment provider',
            };
        }
    } catch (error: any) {
        console.error('Payment creation error:', error);
        return {
            success: false,
            error: error.message || 'Payment creation failed',
        };
    }
}

/**
 * Process a refund
 */
export async function processRefund(
    paymentId: string,
    amount: number,
    provider: PaymentProvider = 'stripe'
): Promise<RefundResult> {
    try {
        if (provider === 'stripe') {
            const refund = await stripe.refunds.create({
                payment_intent: paymentId,
                amount: Math.round(amount * 100), // Amount in cents
            });

            return {
                success: true,
                refundId: refund.id,
            };
        } else if (provider === 'mercadopago') {
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
        } else {
            return {
                success: false,
                error: 'Invalid payment provider',
            };
        }
    } catch (error: any) {
        console.error('Refund processing error:', error);
        return {
            success: false,
            error: error.message || 'Refund processing failed',
        };
    }
}

/**
 * Create a subscription
 */
export async function createSubscription(
    customerId: string,
    priceId: string,
    provider: PaymentProvider = 'stripe'
): Promise<PaymentResult> {
    try {
        if (provider === 'stripe') {
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                expand: ['latest_invoice.payment_intent'],
            });

            return {
                success: true,
                paymentId: subscription.id,
            };
        } else if (provider === 'mercadopago') {
            // MercadoPago subscriptions work differently
            // For now, return an error - will implement if needed
            return {
                success: false,
                error: 'MercadoPago subscriptions not yet implemented',
            };
        } else {
            return {
                success: false,
                error: 'Invalid payment provider',
            };
        }
    } catch (error: any) {
        console.error('Subscription creation error:', error);
        return {
            success: false,
            error: error.message || 'Subscription creation failed',
        };
    }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
    subscriptionId: string,
    provider: PaymentProvider = 'stripe'
): Promise<{ success: boolean; error?: string }> {
    try {
        if (provider === 'stripe') {
            await stripe.subscriptions.cancel(subscriptionId);
            return { success: true };
        } else if (provider === 'mercadopago') {
            return {
                success: false,
                error: 'MercadoPago subscriptions not yet implemented',
            };
        } else {
            return {
                success: false,
                error: 'Invalid payment provider',
            };
        }
    } catch (error: any) {
        console.error('Subscription cancellation error:', error);
        return {
            success: false,
            error: error.message || 'Subscription cancellation failed',
        };
    }
}

/**
 * Create or retrieve a Stripe customer
 */
export async function getOrCreateStripeCustomer(
    email: string,
    userId: string
): Promise<string | null> {
    try {
        // Search for existing customer
        const customers = await stripe.customers.list({
            email: email,
            limit: 1,
        });

        if (customers.data.length > 0) {
            return customers.data[0].id;
        }

        // Create new customer
        const customer = await stripe.customers.create({
            email: email,
            metadata: {
                userId: userId,
            },
        });

        return customer.id;
    } catch (error: any) {
        console.error('Error creating Stripe customer:', error);
        return null;
    }
}
