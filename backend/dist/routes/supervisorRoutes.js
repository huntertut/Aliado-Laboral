"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const supervisorController_1 = require("../controllers/supervisorController");
const router = express_1.default.Router();
// Middleware to ensure user is supervisor could be added here
// For now, we rely on the frontend dashboard being hidden and basic auth
// ideally: router.use(authMiddleware, supervisorOnlyMiddleware)
router.get('/pending-lawyers', auth_1.authMiddleware, supervisorController_1.getPendingLawyers);
router.put('/verify-lawyer/:id', auth_1.authMiddleware, supervisorController_1.verifyLawyer);
exports.default = router;
