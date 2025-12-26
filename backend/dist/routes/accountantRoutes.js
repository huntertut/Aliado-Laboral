"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const accountantController_1 = require("../controllers/accountantController");
const router = express_1.default.Router();
router.get('/pending-payments', auth_1.authMiddleware, accountantController_1.getPendingPayments);
router.put('/verify-payment/:id', auth_1.authMiddleware, accountantController_1.verifyPayment);
exports.default = router;
