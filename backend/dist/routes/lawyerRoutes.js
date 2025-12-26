"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lawyerController_1 = require("../controllers/lawyerController");
const router = (0, express_1.Router)();
router.get('/', lawyerController_1.getLawyers);
router.get('/:id', lawyerController_1.getLawyerById);
router.post('/contact', lawyerController_1.contactLawyer);
exports.default = router;
