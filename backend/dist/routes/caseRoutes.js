"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const caseController_1 = require("../controllers/caseController");
const router = (0, express_1.Router)();
router.post('/', caseController_1.createCase);
router.get('/user/:userId', caseController_1.getUserCases);
router.post('/:caseId/history', caseController_1.addHistoryEvent);
exports.default = router;
