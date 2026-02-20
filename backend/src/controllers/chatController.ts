
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import moment from 'moment';

const prisma = new PrismaClient();

// Send a Message
export const sendMessage = async (req: any, res: Response) => {
    try {
        const { requestId, content, type } = req.body;
        const senderId = req.user.id;

        // 1. Validate Access
        const request = await prisma.contactRequest.findUnique({
            where: { id: requestId },
            include: {
                lawyerProfile: { include: { lawyer: true } },
                worker: true
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        // Check if user is participant
        const isWorker = request.workerId === senderId;
        const isLawyer = request.lawyerProfile?.lawyer?.userId === senderId;
        const isPyme = request.worker.role === 'pyme';

        if (!isWorker && !isLawyer) {
            return res.status(403).json({ error: 'No tienes permiso para participar en este chat' });
        }

        // 2. Schedule Validation for Pymes
        let messageStatus = 'delivered';
        let skipNotification = false;
        let scheduleMessage = '';

        if (isPyme && isWorker) {
            const scheduleStr = request.lawyerProfile?.schedule;
            if (scheduleStr) {
                try {
                    const schedule = JSON.parse(scheduleStr); // { start: "09:00", end: "18:00" }
                    const now = moment();
                    const startTime = moment(schedule.start, "HH:mm");
                    const endTime = moment(schedule.end, "HH:mm");

                    if (!now.isBetween(startTime, endTime)) {
                        messageStatus = 'queued';
                        skipNotification = true;
                        scheduleMessage = `Tu abogado responderá a partir de las ${schedule.start} del siguiente día hábil.`;
                    }
                } catch (e) {
                    console.warn('Invalid schedule format:', scheduleStr);
                }
            }
        }

        // 3. Transaction: Create Message + Update Parent Request
        const result = await prisma.$transaction(async (tx) => {
            // Create Message
            const message = await tx.chatMessage.create({
                data: {
                    requestId,
                    senderId,
                    content,
                    type: type || 'text',
                    status: messageStatus as any,
                    seenAt: null
                }
            });

            // Update Parent Request (Denormalization)
            const updateData: any = {
                lastMessageContent: content,
                lastMessageSenderId: senderId,
                lastMessageAt: new Date(),
                subStatus: isWorker ? 'waiting_lawyer_response' : 'waiting_worker_response'
            };

            if (isWorker) {
                updateData.unreadCountLawyer = { increment: 1 };
                updateData.lastWorkerActivityAt = new Date();
            } else {
                updateData.unreadCountWorker = { increment: 1 };
                updateData.lastLawyerActivityAt = new Date();
            }

            await tx.contactRequest.update({
                where: { id: requestId },
                data: updateData
            });

            return message;
        });

        // 4. Trigger Push Notification (Only if not queued)
        if (!skipNotification) {
            // Ensure lawyerProfile exists if sending to lawyer
            const lawyerId = request.lawyerProfile?.lawyer?.userId;
            const recipientId = isWorker ? (lawyerId || request.workerId) : request.workerId; // Fallback? If no lawyer, worker sends to self? No, to admin?
            // If isWorker and NO lawyer assigned, maybe send to System/Admin? For now, let's keep it safe.

            const senderName = isWorker ? request.worker.fullName || 'Usuario' : request.lawyerProfile?.lawyer?.professionalName || 'Abogado';

            // Send async - don't block response
            import('../services/notificationService').then(({ sendPushNotification }) => {
                sendPushNotification(
                    recipientId,
                    'Nuevo Mensaje',
                    `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                    { requestId, type: 'chat_message' }
                );
            });
            console.log(`Push notification triggered to ${isWorker ? 'Lawyer' : 'Worker'} (${recipientId})`);
        }

        res.json({
            ...result,
            info: scheduleMessage || undefined
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
};

// Get Conversation History
export const getMessages = async (req: any, res: Response) => {
    try {
        const { requestId } = req.params; // or query
        const userId = req.user.id;

        // Validate Access
        const request = await prisma.contactRequest.findUnique({
            where: { id: requestId },
            include: { lawyerProfile: { include: { lawyer: true } } }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        const isWorker = request.workerId === userId;
        const isLawyer = request.lawyerProfile?.lawyer?.userId === userId;

        if (!isWorker && !isLawyer) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        // Fetch Messages
        const messages = await prisma.chatMessage.findMany({
            where: { requestId },
            orderBy: { createdAt: 'asc' },
            take: 100 // Limit for MVP
        });

        // Mark as Seen (Async side effect)
        // If I am Lawyer, I reset unreadCountLawyer
        if (isLawyer && request.unreadCountLawyer > 0) {
            await prisma.contactRequest.update({
                where: { id: requestId },
                data: { unreadCountLawyer: 0 }
            });
        }
        if (isWorker && request.unreadCountWorker > 0) {
            await prisma.contactRequest.update({
                where: { id: requestId },
                data: { unreadCountWorker: 0 }
            });
        }

        res.json(messages);

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
};

// Mark Messages as Read
export const markMessagesAsRead = async (req: any, res: Response) => {
    try {
        const { contactRequestId } = req.params;
        const userId = req.user.id;

        // Validate Access
        const request = await prisma.contactRequest.findUnique({
            where: { id: contactRequestId },
            include: { lawyerProfile: { include: { lawyer: true } } }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        const isWorker = request.workerId === userId;
        const isLawyer = request.lawyerProfile && request.lawyerProfile.lawyer.userId === userId;

        if (!isWorker && !isLawyer) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        // Reset Unread Count
        if (isLawyer) {
            await prisma.contactRequest.update({
                where: { id: contactRequestId },
                data: { unreadCountLawyer: 0 }
            });
        }
        else if (isWorker) {
            await prisma.contactRequest.update({
                where: { id: contactRequestId },
                data: { unreadCountWorker: 0 }
            });
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Error al actualizar estado de lectura' });
    }
};
