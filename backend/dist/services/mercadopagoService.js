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
exports.createMercadoPagoPreference = createMercadoPagoPreference;
exports.getMercadoPagoPaymentStatus = getMercadoPagoPaymentStatus;
exports.refundMercadoPagoPayment = refundMercadoPagoPayment;
exports.verifyMercadoPagoWebhook = verifyMercadoPagoWebhook;
exports.parseMercadoPagoNotification = parseMercadoPagoNotification;
const mercadopago_1 = require("mercadopago");
// Configure MercadoPago with new SDK v2
const client = new mercadopago_1.MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    options: { timeout: 5000 }
});
const preferenceClient = new mercadopago_1.Preference(client);
const paymentClient = new mercadopago_1.Payment(client);
/**
 * Create a MercadoPago payment preference (for workers choosing OXXO/cash)
 */
function createMercadoPagoPreference(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const preference = yield preferenceClient.create({
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
        }
        catch (error) {
            console.error('Error creating MercadoPago preference:', error);
            throw new Error(`MercadoPago preference creation failed: ${error.message}`);
        }
    });
}
/**
 * Get MercadoPago payment status
 */
function getMercadoPagoPaymentStatus(paymentId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payment = yield paymentClient.get({ id: paymentId });
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
        }
        catch (error) {
            console.error('Error getting MercadoPago payment status:', error);
            throw new Error(`MercadoPago payment retrieval failed: ${error.message}`);
        }
    });
}
/**
 * Refund a MercadoPago payment
 * TEMPORARILY DISABLED - Refund API not available in current SDK version
 */
function refundMercadoPagoPayment(paymentId) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
/**
 * Verify MercadoPago webhook signature (optional but recommended)
 */
function verifyMercadoPagoWebhook(headers, body) {
    try {
        // MercadoPago sends a secret token in headers for verification
        const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';
        const receivedSecret = headers['x-signature'] || headers['x-notification-secret'];
        // Basic verification - in production, implement more robust validation
        if (webhookSecret && receivedSecret !== webhookSecret) {
            return false;
        }
        return true;
    }
    catch (error) {
        console.error('Error verifying MercadoPago webhook:', error);
        return false;
    }
}
/**
 * Parse MercadoPago webhook notification
 */
function parseMercadoPagoNotification(body) {
    var _a, _b;
    const { type, data } = body;
    return {
        type, // 'payment', 'merchant_order', etc.
        paymentId: (_a = data === null || data === void 0 ? void 0 : data.id) === null || _a === void 0 ? void 0 : _a.toString(),
        merchantOrderId: (_b = data === null || data === void 0 ? void 0 : data.merchant_order_id) === null || _b === void 0 ? void 0 : _b.toString(),
    };
}
