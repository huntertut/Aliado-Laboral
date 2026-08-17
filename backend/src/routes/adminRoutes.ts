import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { getDashboardStats, getLawyers, verifyLawyer, addStrikeToLawyer, getWorkers, getPymes, getFinancialStats, getPaymentLogs, getAllCases, getPublicPoolCases, getSecurityLogs, getAdminAlerts, resolveAlert, purgeCaseData, updateUserSubscription, updateAdminPassword, syncFirebaseLawyers, broadcastLatestNews, getVaultCompliance, getSystemDiagnostics, testUserPushNotification, purgeInvalidPushTokens, getMonitoringReport, runMonitorNow, changeUserRole, deleteUser } from '../controllers/adminController';
import { getPromotions, createPromotion, updatePromotion, deletePromotion } from '../controllers/promotionController';

const router = express.Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/dashboard', getDashboardStats);

// System Diagnostics & Health Check
router.get('/diagnostics/health', getSystemDiagnostics);
router.post('/diagnostics/test-push', testUserPushNotification);
router.post('/diagnostics/purge-invalid-tokens', purgeInvalidPushTokens);

// Proactive Monitoring System (Level B)
router.get('/diagnostics/monitoring-report', getMonitoringReport);
router.post('/diagnostics/run-monitor-now', runMonitorNow);

// User Management
router.post('/lawyers/sync-firebase', syncFirebaseLawyers);
router.post('/notifications/broadcast-latest', broadcastLatestNews);
router.get('/lawyers', getLawyers);
router.put('/lawyers/:lawyerId/verify', verifyLawyer);
router.post('/lawyers/:lawyerId/strike', addStrikeToLawyer);
router.get('/workers', getWorkers);
router.get('/pymes', getPymes);
router.put('/users/:userId/subscription', updateUserSubscription);
router.put('/users/:userId/role', changeUserRole);
router.delete('/users/:userId', deleteUser);

// Financials
router.get('/financials/stats', getFinancialStats);
router.get('/financials/logs', getPaymentLogs);

// Cases
router.get('/cases', getAllCases);
router.get('/cases/pool', getPublicPoolCases); // Bolsa pública: casos sin abogado asignado
router.post('/cases/:requestId/purge', purgeCaseData);

// Vault Compliance
router.get('/vault-compliance', getVaultCompliance);

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
