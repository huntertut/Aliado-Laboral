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
exports.verifyPayment = exports.getPendingPayments = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get Pending Payments (ContactRequests where payment is not fully settled)
const getPendingPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch requests that are pending/accepted but not fully paid
        const pendingRequests = yield prisma.contactRequest.findMany({
            where: {
                OR: [
                    { workerPaid: false },
                    { lawyerPaid: false }
                ],
                // Optionally filter by status if we only care about active requests
                status: { notIn: ['rejected', 'canceled', 'expired'] }
            },
            include: {
                worker: { select: { fullName: true, email: true } },
                lawyerProfile: {
                    include: {
                        lawyer: {
                            include: { user: { select: { fullName: true, email: true } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(pendingRequests);
    }
    catch (error) {
        console.error('Error fetching pending payments:', error);
        res.status(500).json({ error: 'Error interno al obtener pagos pendientes' });
    }
});
exports.getPendingPayments = getPendingPayments;
// Verify Payment Manually (e.g., bank transfer confirmation)
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // ContactRequest ID
    const { type } = req.body; // 'worker' or 'lawyer'
    try {
        const updateData = {};
        if (type === 'worker') {
            updateData.workerPaid = true;
            updateData.workerPaymentGateway = 'manual_transfer'; // Mark as manual
        }
        else if (type === 'lawyer') {
            updateData.lawyerPaid = true;
            updateData.lawyerPaymentGateway = 'manual_transfer';
        }
        else {
            return res.status(400).json({ error: 'Tipo de pago inválido (worker/lawyer)' });
        }
        // Check if this completes the transaction
        // We need to fetch current state first or use a transaction, 
        // but for simplicity let's update and check logic in a second step or logic hook if needed.
        // Ideally we check if *both* are now paid to update `bothPaymentsSucceeded`.
        const request = yield prisma.contactRequest.findUnique({ where: { id } });
        if (!request)
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        const isFullyPaid = (type === 'worker' ? true : request.workerPaid) &&
            (type === 'lawyer' ? true : request.lawyerPaid);
        if (isFullyPaid) {
            updateData.bothPaymentsSucceeded = true;
        }
        const updatedRequest = yield prisma.contactRequest.update({
            where: { id },
            data: updateData
        });
        res.json({ message: 'Pago verificado correctamente', request: updatedRequest });
    }
    catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'No se pudo verificar el pago' });
    }
});
exports.verifyPayment = verifyPayment;
