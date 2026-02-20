import { PrismaClient } from '@prisma/client';
import * as stripeService from './stripeService';
import * as mercadopagoService from './mercadopagoService';

const prisma = new PrismaClient();

/**
 * CRITICAL FUNCTION: Check if both payments (worker + lawyer) have succeeded
 * This unlocks the contact/case when BOTH conditions are met
 */
export async function checkBothPaymentsSuccess(contactRequestId: string): Promise<boolean> {
    try {
        const contactRequest = await prisma.contactRequest.findUnique({
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
            await prisma.contactRequest.update({
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
    } catch (error: any) {
        console.error('Error checking both payments:', error);
        return false;
    }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: any): Promise<void> {
    try {
        console.log(`Processing Stripe webhook: ${event.type}`);

        switch (event.type) {
            case 'payment_intent.succeeded':
                await handleStripePaymentSuccess(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handleStripePaymentFailure(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleStripeSubscriptionPayment(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleStripeSubscriptionCanceled(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleStripeSubscriptionUpdated(event.data.object);
                break;

            default:
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }
    } catch (error: any) {
        console.error('Error handling Stripe webhook:', error);
        throw error;
    }
}

/**
 * Handle Stripe payment success
 */
async function handleStripePaymentSuccess(paymentIntent: any): Promise<void> {
    const metadata = paymentIntent.metadata || {};
    const { contactRequestId, userId, type } = metadata;

    if (type === 'worker_contact_fee' && contactRequestId) {
        // Worker paid $50 via Stripe
        await prisma.contactRequest.update({
            where: { id: contactRequestId },
            data: {
                workerPaid: true,
                workerTransactionId: paymentIntent.id,
            },
        });

        // Check if both payments succeeded
        await checkBothPaymentsSuccess(contactRequestId);
    } else if (type === 'lawyer_case_acceptance' && contactRequestId) {
        // Lawyer paid $150 via Stripe
        await prisma.contactRequest.update({
            where: { id: contactRequestId },
            data: {
                lawyerPaid: true,
                lawyerTransactionId: paymentIntent.id,
            },
        });

        // Check if both payments succeeded
        await checkBothPaymentsSuccess(contactRequestId);
    }

    console.log(`✅ Stripe payment succeeded: ${paymentIntent.id}`);
}

/**
 * Handle Stripe payment failure
 */
async function handleStripePaymentFailure(paymentIntent: any): Promise<void> {
    const metadata = paymentIntent.metadata || {};
    const { contactRequestId, type } = metadata;

    if (contactRequestId) {
        // Payment failed - trigger refund logic
        console.error(`❌ Stripe payment failed for contact ${contactRequestId}`);

        // TODO: Implement automatic refund of the other party's payment
        // If worker payment failed, refund lawyer
        // If lawyer payment failed, refund worker
    }
}

/**
 * Handle Stripe subscription & Commission payment (lawyer bimonthly $99 or Success Fees)
 */
async function handleStripeSubscriptionPayment(invoice: any): Promise<void> {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    const isCommission = invoice.description && invoice.description.includes('Comisión por Éxito');

    // Find lawyer by Stripe customer ID
    const lawyer = await prisma.lawyer.findFirst({
        where: { stripeCustomerId: customerId },
    });

    if (lawyer) {
        if (isCommission) {
            // HANDLE COMMISSION PAYMENT
            // Find the ContactRequest linked to this invoice (we stored invoiceId in metadata or schema)
            // Ideally we'd query by invoiceId if we stored it
            const request = await prisma.contactRequest.findFirst({
                where: { commissionInvoiceId: invoice.id }
            });

            if (request) {
                await prisma.contactRequest.update({
                    where: { id: request.id },
                    data: { commissionStatus: 'paid' }
                });
                console.log(`💰 Commission PAID for Request ${request.id}`);
                // TODO: Notify Admin Dashboard via Socket/Push
            }

        } else {
            // HANDLE SUBSCRIPTION RENEWAL
            await prisma.lawyer.update({
                where: { id: lawyer.id },
                data: {
                    subscriptionStatus: 'active',
                    subscriptionEndDate: new Date(invoice.period_end * 1000),
                },
            });
            console.log(`✅ Lawyer subscription renewed: ${lawyer.id}`);
        }
    }
}

/**
 * Handle Invoice Payment FAILED (Subscription or Commission)
 */
async function handleStripeInvoicePaymentFailed(invoice: any): Promise<void> {
    const customerId = invoice.customer;
    const isCommission = invoice.description && invoice.description.includes('Comisión por Éxito');

    // Find lawyer by Stripe customer ID
    const lawyer = await prisma.lawyer.findFirst({
        where: { stripeCustomerId: customerId },
    });

    if (lawyer && isCommission) {
        // CRITICAL: MARK AS MOROSO
        // The lawyer failed to pay the Success Fee
        const request = await prisma.contactRequest.findFirst({
            where: { commissionInvoiceId: invoice.id }
        });

        if (request) {
            await prisma.contactRequest.update({
                where: { id: request.id },
                data: { commissionStatus: 'overdue' }
            });
            console.log(`⛔ Commission FAILED for Request ${request.id}. Lawyer is now effectively blocked.`);
        }
    }
}

/**
 * Handle Stripe subscription canceled
 */
async function handleStripeSubscriptionCanceled(subscription: any): Promise<void> {
    const customerId = subscription.customer;

    const lawyer = await prisma.lawyer.findFirst({
        where: { stripeCustomerId: customerId },
    });

    if (lawyer) {
        await prisma.lawyer.update({
            where: { id: lawyer.id },
            data: {
                subscriptionStatus: 'canceled',
            },
        });

        console.log(`❌ Lawyer subscription canceled: ${lawyer.id}`);
    }
}

/**
 * Handle Stripe subscription updated
 */
async function handleStripeSubscriptionUpdated(subscription: any): Promise<void> {
    const customerId = subscription.customer;

    const lawyer = await prisma.lawyer.findFirst({
        where: { stripeCustomerId: customerId },
    });

    if (lawyer) {
        await prisma.lawyer.update({
            where: { id: lawyer.id },
            data: {
                subscriptionStatus: subscription.status,
                subscriptionEndDate: new Date(subscription.current_period_end * 1000),
            },
        });

        console.log(`🔄 Lawyer subscription updated: ${lawyer.id} - ${subscription.status}`);
    }
}

/**
 * Handle MercadoPago webhook notifications
 */
export async function handleMercadoPagoWebhook(notification: any): Promise<void> {
    try {
        const { type, paymentId } = mercadopagoService.parseMercadoPagoNotification(notification);

        console.log(`Processing MercadoPago webhook: ${type} - Payment: ${paymentId}`);

        if (type === 'payment' && paymentId) {
            const paymentStatus = await mercadopagoService.getMercadoPagoPaymentStatus(paymentId);

            if (paymentStatus.status === 'approved') {
                await handleMercadoPagoPaymentSuccess(paymentStatus);
            } else if (paymentStatus.status === 'rejected') {
                await handleMercadoPagoPaymentFailure(paymentStatus);
            }
        }
    } catch (error: any) {
        console.error('Error handling MercadoPago webhook:', error);
        throw error;
    }
}

/**
 * Handle MercadoPago payment success
 */
async function handleMercadoPagoPaymentSuccess(payment: any): Promise<void> {
    const externalReference = payment.externalReference; // This should be contactRequestId

    if (externalReference) {
        // Worker paid $50 via MercadoPago
        await prisma.contactRequest.update({
            where: { id: externalReference },
            data: {
                workerPaid: true,
                workerTransactionId: payment.id.toString(),
            },
        });

        // Check if both payments succeeded
        await checkBothPaymentsSuccess(externalReference);

        console.log(`✅ MercadoPago payment approved: ${payment.id}`);
    }
}

/**
 * Handle MercadoPago payment failure
 */
async function handleMercadoPagoPaymentFailure(payment: any): Promise<void> {
    const externalReference = payment.externalReference;

    if (externalReference) {
        console.error(`❌ MercadoPago payment rejected for contact ${externalReference}`);

        // TODO: Notify worker and potentially refund lawyer if already charged
    }
}
