"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contactController = __importStar(require("../controllers/contactController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// WORKER - Create contact request with payment
router.post('/create-with-payment', auth_1.authMiddleware, contactController.createContactRequestWithPayment);
// WORKER - Get my contact requests
router.get('/my-requests', auth_1.authMiddleware, contactController.getMyRequests);
// LAWYER - Get received requests
router.get('/lawyer/requests', auth_1.authMiddleware, contactController.getLawyerRequests);
// LAWYER - Accept request (triggers dual charge: worker $50 + lawyer $150)
router.post('/lawyer/:id/accept', auth_1.authMiddleware, contactController.acceptContactRequest);
// LAWYER - Reject request (triggers worker refund)
router.post('/lawyer/:id/reject', auth_1.authMiddleware, contactController.rejectContactRequest);
// LAWYER - Get unlocked contact info (only if bothPaymentsSucceeded)
router.get('/lawyer/:id/contact', auth_1.authMiddleware, contactController.getUnlockedContact);
exports.default = router;
