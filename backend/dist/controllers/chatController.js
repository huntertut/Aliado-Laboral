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
exports.markMessagesAsRead = exports.getMessages = exports.sendMessage = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Send a Message
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestId, content, type } = req.body;
        const senderId = req.user.id;
        // 1. Validate Access
        const request = yield prisma.contactRequest.findUnique({
            where: { id: requestId },
            include: { lawyerProfile: { include: { lawyer: true } } }
        });
        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        // Check if user is participant
        const isWorker = request.workerId === senderId;
        const isLawyer = request.lawyerProfile.lawyer.userId === senderId;
        if (!isWorker && !isLawyer) {
            return res.status(403).json({ error: 'No tienes permiso para participar en este chat' });
        }
        // 2. Transaction: Create Message + Update Parent Request
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create Message
            const message = yield tx.chatMessage.create({
                data: {
                    requestId,
                    senderId,
                    content,
                    type: type || 'text',
                    seenAt: null
                }
            });
            // Update Parent Request (Denormalization)
            // If sender is Worker -> Lawyer has unread.
            // If sender is Lawyer -> Worker has unread.
            const updateData = {
                lastMessageContent: content,
                lastMessageSenderId: senderId,
                lastMessageAt: new Date(),
                subStatus: isWorker ? 'waiting_lawyer_response' : 'waiting_worker_response'
            };
            if (isWorker) {
                updateData.unreadCountLawyer = { increment: 1 };
                // Also update SLA timestamp
                updateData.lastWorkerActivityAt = new Date();
            }
            else {
                updateData.unreadCountWorker = { increment: 1 };
                // Also update SLA timestamp
                updateData.lastLawyerActivityAt = new Date();
            }
            yield tx.contactRequest.update({
                where: { id: requestId },
                data: updateData
            });
            return message;
        }));
        // TODO: Trigger Push Notification here
        res.json(result);
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
});
exports.sendMessage = sendMessage;
// Get Conversation History
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestId } = req.params; // or query
        const userId = req.user.id;
        // Validate Access
        const request = yield prisma.contactRequest.findUnique({
            where: { id: requestId },
            include: { lawyerProfile: { include: { lawyer: true } } }
        });
        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        const isWorker = request.workerId === userId;
        const isLawyer = request.lawyerProfile.lawyer.userId === userId;
        if (!isWorker && !isLawyer) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        // Fetch Messages
        const messages = yield prisma.chatMessage.findMany({
            where: { requestId },
            orderBy: { createdAt: 'asc' },
            take: 100 // Limit for MVP
        });
        // Mark as Seen (Async side effect)
        // If I am Lawyer, I reset unreadCountLawyer
        if (isLawyer && request.unreadCountLawyer > 0) {
            yield prisma.contactRequest.update({
                where: { id: requestId },
                data: { unreadCountLawyer: 0 }
            });
        }
        if (isWorker && request.unreadCountWorker > 0) {
            yield prisma.contactRequest.update({
                where: { id: requestId },
                data: { unreadCountWorker: 0 }
            });
        }
        res.json(messages);
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
});
exports.getMessages = getMessages;
// Mark Messages as Read
const markMessagesAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contactRequestId } = req.params;
        const userId = req.user.id;
        // Validate Access
        const request = yield prisma.contactRequest.findUnique({
            where: { id: contactRequestId },
            include: { lawyerProfile: { include: { lawyer: true } } }
        });
        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        const isWorker = request.workerId === userId;
        const isLawyer = request.lawyerProfile.lawyer.userId === userId;
        if (!isWorker && !isLawyer) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        // Reset Unread Count
        if (isLawyer) {
            yield prisma.contactRequest.update({
                where: { id: contactRequestId },
                data: { unreadCountLawyer: 0 }
            });
        }
        else if (isWorker) {
            yield prisma.contactRequest.update({
                where: { id: contactRequestId },
                data: { unreadCountWorker: 0 }
            });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Error al actualizar estado de lectura' });
    }
});
exports.markMessagesAsRead = markMessagesAsRead;
