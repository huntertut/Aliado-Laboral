"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const subscriptionController_1 = require("../controllers/subscriptionController");
const router = express_1.default.Router();
router.get('/status', auth_1.authMiddleware, subscriptionController_1.getSubscriptionStatus);
router.post('/upgrade', auth_1.authMiddleware, subscriptionController_1.upgradeSubscription);
exports.default = router;
