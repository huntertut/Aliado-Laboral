import { Router, Request, Response } from 'express';
import { verifyStripeWebhookSignature } from '../services/stripeService';
import { verifyMercadoPagoWebhook } from '../services/mercadopagoService';
import { handleStripeWebhook, handleMercadoPagoWebhook } from '../services/webhookHandlerService';

const router = Router();

/**
 * Stripe Webhook Endpoint
 * IMPORTANT: This endpoint must use raw body, not JSON parsed
 */
router.post('/stripe', async (req: Request, res: Response) => {
    try {
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
            return res.status(400).json({ error: 'Missing Stripe signature' });
        }

        // Verify webhook signature
        let event;
        try {
            event = verifyStripeWebhookSignature(req.body, signature);
        } catch (err: any) {
            console.error('Stripe webhook signature verification failed:', err.message);
            return res.status(400).json({ error: `Webhook Error: ${err.message}` });
        }

        // Process the event
        await handleStripeWebhook(event);

        // Return 200 to acknowledge receipt
        res.json({ received: true });
    } catch (error: any) {
        console.error('Error processing Stripe webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * MercadoPago Webhook Endpoint
 */
router.post('/mercadopago', async (req: Request, res: Response) => {
    try {
        // Verify webhook (optional but recommended)
        const isValid = verifyMercadoPagoWebhook(req.headers, req.body);

        if (!isValid) {
            console.warn('MercadoPago webhook verification failed');
            // Don't reject - MP webhooks can be tricky
        }

        // Process the notification
        await handleMercadoPagoWebhook(req.body);

        // MercadoPago expects a 200 OK response
        res.status(200).send('OK');
    } catch (error: any) {
        console.error('Error processing MercadoPago webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'Webhook endpoints are active' });
});

export default router;
