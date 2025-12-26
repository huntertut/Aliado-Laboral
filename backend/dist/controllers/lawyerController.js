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
exports.contactLawyer = exports.getLawyerById = exports.getLawyers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all verified lawyers
const getLawyers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lawyers = yield prisma.lawyer.findMany({
            where: { isVerified: true },
            include: {
                user: {
                    select: { fullName: true, email: true }
                }
            }
        });
        res.json(lawyers);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getLawyers = getLawyers;
// Get lawyer by ID
const getLawyerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const lawyer = yield prisma.lawyer.findUnique({
            where: { id },
            include: {
                user: {
                    select: { fullName: true, email: true }
                }
            }
        });
        if (!lawyer) {
            return res.status(404).json({ error: 'Lawyer not found' });
        }
        res.json(lawyer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getLawyerById = getLawyerById;
// Contact lawyer (Mock implementation for MVP)
const contactLawyer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lawyerId, message, userContact } = req.body;
        // In a real app, this would send an email or push notification to the lawyer
        // and create a record in a 'LawyerRequest' table.
        console.log(`Contact request for lawyer ${lawyerId}:`, { message, userContact });
        res.json({ message: 'Solicitud enviada con éxito. El abogado te contactará pronto.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.contactLawyer = contactLawyer;
