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
router.post('/lawyer/request/:id/accept', authMiddleware, contactController.acceptContactRequest); // Legacy alias for Build 84

// LAWYER - Reject request (triggers worker refund)
router.post('/lawyer/:id/reject', authMiddleware, contactController.rejectContactRequest);
router.post('/lawyer/request/:id/reject', authMiddleware, contactController.rejectContactRequest); // Legacy alias for Build 84

// LAWYER - Get unlocked contact info (only if bothPaymentsSucceeded)
router.get('/lawyer/:id/contact', authMiddleware, contactController.getUnlockedContact);
router.get('/lawyer/request/:id/contact', authMiddleware, contactController.getUnlockedContact); // Legacy alias for Build 84

// LAWYER - Update CRM Status (e.g. 'CLOSED_WON')
router.patch('/lawyer/:id/status', authMiddleware, contactController.updateCRMStatus);

// LAWYER - AI Suggest First Reply
router.post('/lawyer/:id/suggest-reply', authMiddleware, contactController.suggestReply);

export default router;
