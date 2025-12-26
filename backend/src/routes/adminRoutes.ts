import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { getDashboardStats, getLawyers, verifyLawyer, getWorkers, getFinancialStats, getPaymentLogs, getAllCases, getSecurityLogs, getAdminAlerts, resolveAlert } from '../controllers/adminController';

const router = express.Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/dashboard', getDashboardStats);

// User Management
router.get('/lawyers', getLawyers);
router.put('/lawyers/:lawyerId/verify', verifyLawyer);
router.get('/workers', getWorkers);

// Financials
router.get('/financials/stats', getFinancialStats);
router.get('/financials/logs', getPaymentLogs);

// Cases
router.get('/cases', getAllCases);

// Security
router.get('/security/logs', getSecurityLogs);
router.get('/security/alerts', getAdminAlerts);
router.put('/security/alerts/:alertId/resolve', resolveAlert);

export default router;
