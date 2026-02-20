import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPendingPayments, verifyPayment } from '../controllers/accountantController';

const router = express.Router();

router.get('/pending-payments', authMiddleware, getPendingPayments);
router.put('/verify-payment/:id', authMiddleware, verifyPayment);

export default router;
