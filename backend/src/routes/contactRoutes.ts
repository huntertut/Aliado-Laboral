import { Router } from 'express';
import * as contactController from '../controllers/contactController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// WORKER - Create contact request with payment
router.post('/create-with-payment', authMiddleware, contactController.createContactRequestWithPayment);

// WORKER - Get my contact requests
router.get('/my-requests', authMiddleware, contactController.getMyRequests);

// LAWYER - Get received requests
router.get('/lawyer/requests', authMiddleware, contactController.getLawyerRequests);

// LAWYER - Accept request (triggers dual charge: worker $50 + lawyer $150)
router.post('/lawyer/:id/accept', authMiddleware, contactController.acceptContactRequest);

// LAWYER - Reject request (triggers worker refund)
router.post('/lawyer/:id/reject', authMiddleware, contactController.rejectContactRequest);

// LAWYER - Get unlocked contact info (only if bothPaymentsSucceeded)
router.get('/lawyer/:id/contact', authMiddleware, contactController.getUnlockedContact);

// LAWYER - Update CRM Status (e.g. 'CLOSED_WON')
router.patch('/lawyer/:id/status', authMiddleware, contactController.updateCRMStatus);

export default router;
