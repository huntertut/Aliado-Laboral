import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { getDashboardStats, getLawyers, verifyLawyer, addStrikeToLawyer, getWorkers, getPymes, getFinancialStats, getPaymentLogs, getAllCases, getSecurityLogs, getAdminAlerts, resolveAlert, purgeCaseData, updateUserSubscription, updateAdminPassword, syncFirebaseLawyers } from '../controllers/adminController';
import { getPromotions, createPromotion, updatePromotion, deletePromotion } from '../controllers/promotionController';

const router = express.Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/dashboard', getDashboardStats);

// User Management
router.post('/lawyers/sync-firebase', syncFirebaseLawyers);
router.get('/lawyers', getLawyers);
router.put('/lawyers/:lawyerId/verify', verifyLawyer);
router.post('/lawyers/:lawyerId/strike', addStrikeToLawyer);
router.get('/workers', getWorkers);
router.get('/pymes', getPymes);
router.put('/users/:userId/subscription', updateUserSubscription);

// Financials
router.get('/financials/stats', getFinancialStats);
router.get('/financials/logs', getPaymentLogs);

// Cases
router.get('/cases', getAllCases);
router.post('/cases/:requestId/purge', purgeCaseData);

// Security
router.get('/security/logs', getSecurityLogs);
router.get('/security/alerts', getAdminAlerts);
router.put('/security/alerts/:alertId/resolve', resolveAlert);
router.put('/security/password', updateAdminPassword);

// Promotions
router.get('/promotions', getPromotions);
router.post('/promotions', createPromotion);
router.put('/promotions/:id', updatePromotion);
router.delete('/promotions/:id', deletePromotion);

export default router;
