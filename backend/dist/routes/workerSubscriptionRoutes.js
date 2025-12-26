"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const workerSubscriptionController_1 = require("../controllers/workerSubscriptionController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authMiddleware);
// Get my subscription status
router.get('/my-subscription', workerSubscriptionController_1.getMySubscription);
// Create/activate subscription
router.post('/subscribe', workerSubscriptionController_1.createSubscription);
// Cancel subscription
router.post('/cancel', workerSubscriptionController_1.cancelMySubscription);
exports.default = router;
