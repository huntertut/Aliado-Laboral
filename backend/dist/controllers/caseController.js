"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHistoryEvent = exports.getUserCases = exports.createCase = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create a new legal case
const createCase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, title, employerName, startDate } = req.body;
        const newCase = yield prisma.legalCase.create({
            data: {
                userId,
                title,
                employerName,
                startDate: new Date(startDate),
                status: 'active'
            }
        });
        res.status(201).json(newCase);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createCase = createCase;
// Get all cases for a user
const getUserCases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const cases = yield prisma.legalCase.findMany({
            where: { userId },
            include: {
                history: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(cases);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getUserCases = getUserCases;
// Add an event to a case history
const addHistoryEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { caseId } = req.params;
        const { eventType, description, occurredAt } = req.body;
        const event = yield prisma.caseHistory.create({
            data: {
                caseId,
                eventType,
                description,
                occurredAt: new Date(occurredAt)
            }
        });
        res.status(201).json(event);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.addHistoryEvent = addHistoryEvent;
