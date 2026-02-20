import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-11-17.clover' as any, // Cast to avoid TS strict check if logic doesn't depend on it
    typescript: true,
});

export interface StripeCustomerData {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
}

export interface StripeSubscriptionData {
    customerId: string;
    priceId: string;
    metadata?: Record<string, string>;
}

/**
 * Create a Stripe customer (for lawyers and workers who choose Stripe)
 */
export async function createStripeCustomer(data: StripeCustomerData): Promise<Stripe.Customer> {
    try {
        const customer = await stripe.customers.create({
            email: data.email,
            name: data.name,
            metadata: data.metadata || {},
        });

        return customer;
    } catch (error: any) {
        console.error('Error creating Stripe customer:', error);
        throw new Error(`Stripe customer creation failed: ${error.message}`);
    }
}

/**
 * Charge a Stripe customer (one-time payment)
 */
export async function chargeStripeCustomer(
    customerId: string,
    amount: number,
    currency: string = 'MXN',
    description: string = 'Payment',
    metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
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
    } catch (error: any) {
        console.error('Error charging Stripe customer:', error);
        throw new Error(`Stripe charge failed: ${error.message}`);
    }
}

/**
 * Create a Stripe subscription (for lawyers - $99 bimonthly)
 */
export async function createStripeSubscription(
    data: StripeSubscriptionData
): Promise<Stripe.Subscription> {
    try {
        const subscription = await stripe.subscriptions.create({
            customer: data.customerId,
            items: [{ price: data.priceId }],
            metadata: data.metadata || {},
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });

        return subscription;
    } catch (error: any) {
        console.error('Error creating Stripe subscription:', error);
        throw new Error(`Stripe subscription creation failed: ${error.message}`);
    }
}

/**
 * Attach a payment method to a customer
 */
export async function attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
): Promise<Stripe.PaymentMethod> {
    try {
        const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });

        // Set as default payment method
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        return paymentMethod;
    } catch (error: any) {
        console.error('Error attaching payment method:', error);
        throw new Error(`Payment method attachment failed: ${error.message}`);
    }
}

/**
 * Refund a Stripe charge
 */
export async function refundStripeCharge(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> {
    try {
        const refundData: Stripe.RefundCreateParams = {
            payment_intent: paymentIntentId,
            reason: reason || 'requested_by_customer',
        };

        if (amount) {
            refundData.amount = Math.round(amount * 100);
        }

        const refund = await stripe.refunds.create(refundData);

        return refund;
    } catch (error: any) {
        console.error('Error refunding Stripe charge:', error);
        throw new Error(`Stripe refund failed: ${error.message}`);
    }
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelStripeSubscription(
    subscriptionId: string,
    immediately: boolean = false
): Promise<Stripe.Subscription> {
    try {
        if (immediately) {
            return await stripe.subscriptions.cancel(subscriptionId);
        } else {
            return await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });
        }
    } catch (error: any) {
        console.error('Error canceling Stripe subscription:', error);
        throw new Error(`Stripe subscription cancellation failed: ${error.message}`);
    }
}

/**
 * Get Stripe customer by ID
 */
export async function getStripeCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
        const customer = await stripe.customers.retrieve(customerId);
        return customer as Stripe.Customer;
    } catch (error: any) {
        console.error('Error retrieving Stripe customer:', error);
        throw new Error(`Stripe customer retrieval failed: ${error.message}`);
    }
}

/**
 * Get Stripe subscription by ID
 */
export async function getStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        return subscription;
    } catch (error: any) {
        console.error('Error retrieving Stripe subscription:', error);
        throw new Error(`Stripe subscription retrieval failed: ${error.message}`);
    }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhookSignature(
    payload: string | Buffer,
    signature: string
): Stripe.Event {
    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        return event;
    } catch (error: any) {
        console.error('Error verifying Stripe webhook signature:', error);
        throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
}

/**
 * EL PUENTE: Success Fee Automation
 * Generates an Invoice for the Success Fee (Commission)
 */
export async function createCommissionInvoice(
    customerId: string,
    amount: number, // In MXN
    description: string
): Promise<Stripe.Invoice> {
    try {
        // 1. Create Invoice Item (The Line Item)
        await stripe.invoiceItems.create({
            customer: customerId,
            amount: Math.round(amount * 100),
            currency: 'mxn',
            description: description
        });

        // 2. Create the Invoice (Draft)
        const invoice = await stripe.invoices.create({
            customer: customerId,
            auto_advance: true, // Auto-finalize
            collection_method: 'send_invoice', // Email the lawyer
            days_until_due: 5 // 5 Days grace period as per Gamification Rules
        });

        // 3. Finalize immediately to send email
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

        return finalizedInvoice;

    } catch (error: any) {
        console.error('Error creating commission invoice:', error);
        throw new Error(`Failed to create commission invoice: ${error.message}`);
    }
}

/**
 * EL PUENTE: Gamification / Gatekeeping
 * Checks if the lawyer has overdue invoices > 5 days
 */
export async function checkOverdueInvoices(customerId: string): Promise<boolean> {
    try {
        const invoices = await stripe.invoices.list({
            customer: customerId,
            status: 'open', // Unpaid
        });

        const now = new Date();
        // Check if any invoice is past due
        const hasOverdue = invoices.data.some(inv => {
            if (!inv.due_date) return false;
            return new Date(inv.due_date * 1000) < now;
        });

        return hasOverdue;

    } catch (error: any) {
        console.error('Error checking overdue invoices:', error);
        // Fail safe: If error, assume no overdue to avoid blocking mistakenly?
        // Or strict: Block. Let's return false for MVP safety.
        return false;
    }
}

export default stripe;
