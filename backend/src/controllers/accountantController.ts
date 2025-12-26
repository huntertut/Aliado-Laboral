import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Pending Payments (ContactRequests where payment is not fully settled)
export const getPendingPayments = async (req: Request, res: Response) => {
    try {
        // Fetch requests that are pending/accepted but not fully paid
        const pendingRequests = await prisma.contactRequest.findMany({
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
    } catch (error) {
        console.error('Error fetching pending payments:', error);
        res.status(500).json({ error: 'Error interno al obtener pagos pendientes' });
    }
};

// Verify Payment Manually (e.g., bank transfer confirmation)
export const verifyPayment = async (req: Request, res: Response) => {
    const { id } = req.params; // ContactRequest ID
    const { type } = req.body; // 'worker' or 'lawyer'

    try {
        const updateData: any = {};
        if (type === 'worker') {
            updateData.workerPaid = true;
            updateData.workerPaymentGateway = 'manual_transfer'; // Mark as manual
        } else if (type === 'lawyer') {
            updateData.lawyerPaid = true;
            updateData.lawyerPaymentGateway = 'manual_transfer';
        } else {
            return res.status(400).json({ error: 'Tipo de pago inválido (worker/lawyer)' });
        }

        // Check if this completes the transaction
        // We need to fetch current state first or use a transaction, 
        // but for simplicity let's update and check logic in a second step or logic hook if needed.
        // Ideally we check if *both* are now paid to update `bothPaymentsSucceeded`.

        const request = await prisma.contactRequest.findUnique({ where: { id } });
        if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });

        const isFullyPaid = (type === 'worker' ? true : request.workerPaid) &&
            (type === 'lawyer' ? true : request.lawyerPaid);

        if (isFullyPaid) {
            updateData.bothPaymentsSucceeded = true;
        }

        const updatedRequest = await prisma.contactRequest.update({
            where: { id },
            data: updateData
        });

        res.json({ message: 'Pago verificado correctamente', request: updatedRequest });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'No se pudo verificar el pago' });
    }
};
