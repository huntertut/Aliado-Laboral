"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const adminController_1 = require("../controllers/adminController");
const router = express_1.default.Router();
// Protect all admin routes
router.use(auth_1.authMiddleware);
router.use(adminMiddleware_1.adminMiddleware);
router.get('/dashboard', adminController_1.getDashboardStats);
// User Management
router.get('/lawyers', adminController_1.getLawyers);
router.put('/lawyers/:lawyerId/verify', adminController_1.verifyLawyer);
router.get('/workers', adminController_1.getWorkers);
// Financials
router.get('/financials/stats', adminController_1.getFinancialStats);
router.get('/financials/logs', adminController_1.getPaymentLogs);
// Cases
router.get('/cases', adminController_1.getAllCases);
// Security
router.get('/security/logs', adminController_1.getSecurityLogs);
router.get('/security/alerts', adminController_1.getAdminAlerts);
router.put('/security/alerts/:alertId/resolve', adminController_1.resolveAlert);
exports.default = router;
