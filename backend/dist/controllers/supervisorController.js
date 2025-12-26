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
exports.verifyLawyer = exports.getPendingLawyers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get Pending Lawyers (unverified or verification requested)
const getPendingLawyers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch lawyers where isVerified is false
        // Include partial User data for display (name, email)
        const lawyers = yield prisma.lawyer.findMany({
            where: { isVerified: false },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                },
                profile: true, // Include extend profile for details if needed
                subscription: true
            }
        });
        res.json(lawyers);
    }
    catch (error) {
        console.error('Error fetching pending lawyers:', error);
        res.status(500).json({ error: 'Error interno al obtener abogados pendientes' });
    }
});
exports.getPendingLawyers = getPendingLawyers;
// Verify Lawyer
const verifyLawyer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // Is this Lawyer.id or User.id? Let's assume Lawyer.id for precision
    try {
        const updatedLawyer = yield prisma.lawyer.update({
            where: { id },
            data: { isVerified: true }
        });
        // Log the action (ActivityLog)
        // If we had the supervisor's ID from req.user, we'd log it
        res.json({ message: 'Abogado verificado correctamente', lawyer: updatedLawyer });
    }
    catch (error) {
        console.error('Error verifying lawyer:', error);
        res.status(500).json({ error: 'No se pudo verificar al abogado' });
    }
});
exports.verifyLawyer = verifyLawyer;
