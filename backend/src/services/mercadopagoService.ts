import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Configure MercadoPago with new SDK v2
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    options: { timeout: 5000 }
});

const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);
// const refundClient = new Refund(client); // TEMPORARILY DISABLED - not available in this SDK version

export interface MercadoPagoPreferenceData {
    amount: number;
    description: string;
    email: string;
    metadata?: Record<string, any>;
    externalReference?: string;
}

/**
 * Create a MercadoPago payment preference (for workers choosing OXXO/cash)
 */
export async function createMercadoPagoPreference(
    data: MercadoPagoPreferenceData
): Promise<any> {
    try {
        const preference = await preferenceClient.create({
            body: {
                items: [
                    {
                        id: 'item-01',
                        title: data.description,
                        unit_price: data.amount,
                        quantity: 1,
                        currency_id: 'MXN',
                    },
                ],
                payer: {
                    email: data.email,
                },
                external_reference: data.externalReference || '',
                metadata: data.metadata || {},
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/payment/success`,
                    failure: `${process.env.FRONTEND_URL}/payment/failure`,
                    pending: `${process.env.FRONTEND_URL}/payment/pending`,
                },
                auto_return: 'approved',
                notification_url: `${process.env.BACKEND_URL}/webhooks/mercadopago`,
                statement_descriptor: 'ALIADO LABORAL',
                payment_methods: {
                    excluded_payment_methods: [],
                    excluded_payment_types: [],
                    installments: 1,
                },
            }
        });

        return {
            id: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
        };
    } catch (error: any) {
        console.error('Error creating MercadoPago preference:', error);
        throw new Error(`MercadoPago preference creation failed: ${error.message}`);
    }
}

/**
 * Get MercadoPago payment status
 */
export async function getMercadoPagoPaymentStatus(paymentId: string): Promise<any> {
    try {
        const payment = await paymentClient.get({ id: paymentId });

        return {
            id: payment.id,
            status: payment.status,
            statusDetail: payment.status_detail,
            amount: payment.transaction_amount,
            currency: payment.currency_id,
            paymentMethod: payment.payment_method_id,
            externalReference: payment.external_reference,
            metadata: payment.metadata,
        };
    } catch (error: any) {
        console.error('Error getting MercadoPago payment status:', error);
        throw new Error(`MercadoPago payment retrieval failed: ${error.message}`);
    }
}

/**
 * Refund a MercadoPago payment
 * TEMPORARILY DISABLED - Refund API not available in current SDK version
 */
export async function refundMercadoPagoPayment(paymentId: string): Promise<any> {
    // try {
    //     const refund = await refundClient.create({
    //         body: {
    //             payment_id: parseInt(paymentId),
    //         }
    //     });
    //
    //     return {
    //         id: refund.id,
    //         status: refund.status,
    //         amount: refund.amount,
    //     };
    // } catch (error: any) {
    //     console.error('Error refunding MercadoPago payment:', error);
    //     throw new Error(`MercadoPago refund failed: ${error.message}`);
    // }

    console.warn('MercadoPago refund temporarily disabled - upgrade SDK to enable');
    throw new Error('Refund functionality temporarily unavailable');
}

/**
 * Verify MercadoPago webhook signature (optional but recommended)
 */
export function verifyMercadoPagoWebhook(headers: any, body: any): boolean {
    try {
        // MercadoPago sends a secret token in headers for verification
        const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';
        const receivedSecret = headers['x-signature'] || headers['x-notification-secret'];

        // Basic verification - in production, implement more robust validation
        if (webhookSecret && receivedSecret !== webhookSecret) {
            return false;
        }

        return true;
    } catch (error: any) {
        console.error('Error verifying MercadoPago webhook:', error);
        return false;
    }
}

/**
 * Parse MercadoPago webhook notification
 */
export function parseMercadoPagoNotification(body: any): {
    type: string;
    paymentId?: string;
    merchantOrderId?: string;
} {
    const { type, data } = body;

    return {
        type, // 'payment', 'merchant_order', etc.
        paymentId: data?.id?.toString(),
        merchantOrderId: data?.merchant_order_id?.toString(),
    };
}
