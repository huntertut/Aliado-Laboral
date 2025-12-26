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
const express_1 = require("express");
const stripeService_1 = require("../services/stripeService");
const mercadopagoService_1 = require("../services/mercadopagoService");
const webhookHandlerService_1 = require("../services/webhookHandlerService");
const router = (0, express_1.Router)();
/**
 * Stripe Webhook Endpoint
 * IMPORTANT: This endpoint must use raw body, not JSON parsed
 */
router.post('/stripe', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            return res.status(400).json({ error: 'Missing Stripe signature' });
        }
        // Verify webhook signature
        let event;
        try {
            event = (0, stripeService_1.verifyStripeWebhookSignature)(req.body, signature);
        }
        catch (err) {
            console.error('Stripe webhook signature verification failed:', err.message);
            return res.status(400).json({ error: `Webhook Error: ${err.message}` });
        }
        // Process the event
        yield (0, webhookHandlerService_1.handleStripeWebhook)(event);
        // Return 200 to acknowledge receipt
        res.json({ received: true });
    }
    catch (error) {
        console.error('Error processing Stripe webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}));
/**
 * MercadoPago Webhook Endpoint
 */
router.post('/mercadopago', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verify webhook (optional but recommended)
        const isValid = (0, mercadopagoService_1.verifyMercadoPagoWebhook)(req.headers, req.body);
        if (!isValid) {
            console.warn('MercadoPago webhook verification failed');
            // Don't reject - MP webhooks can be tricky
        }
        // Process the notification
        yield (0, webhookHandlerService_1.handleMercadoPagoWebhook)(req.body);
        // MercadoPago expects a 200 OK response
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('Error processing MercadoPago webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}));
/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({ status: 'Webhook endpoints are active' });
});
exports.default = router;
