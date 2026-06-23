import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getBusinessDaysDiff, getWorkerDaysDiff } from '../utils/businessDays';
import { sendPushNotification } from '../services/notificationService';

const prisma = new PrismaClient();

/**
 * GET: Fetch request information and inactivity flags for options menu
 */
export const getRequestInfo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const request = await prisma.contactRequest.findUnique({
            where: { id },
            include: {
                worker: {
                    select: {
                        id: true,
                        fullName: true,
                    }
                },
                lawyerProfile: {
                    include: {
                        lawyer: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        // Verify if user is either the worker or the assigned lawyer
        const isWorker = request.workerId === userId;
        
        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });
        const isLawyer = lawyer && request.lawyerProfileId === lawyer.profile?.id;

        if (!isWorker && !isLawyer) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const now = new Date();

        // Calculate inactivity metrics
        let canReassignLawyer = false;
        let businessDaysSinceWorkerActivity = 0;
        if (request.status === 'accepted' && request.subStatus === 'waiting_lawyer_response' && request.lastWorkerActivityAt) {
            businessDaysSinceWorkerActivity = getBusinessDaysDiff(request.lastWorkerActivityAt, now);
            if (businessDaysSinceWorkerActivity >= 5) {
                canReassignLawyer = true;
            }
        }

        let canArchiveCase = false;
        let workerDaysSinceLawyerActivity = 0;
        if (request.status === 'accepted' && request.subStatus === 'waiting_worker_response' && request.lastLawyerActivityAt) {
            workerDaysSinceLawyerActivity = getWorkerDaysDiff(request.lastLawyerActivityAt, now);
            if (workerDaysSinceLawyerActivity >= 7) {
                canArchiveCase = true;
            }
        }

        res.json({
            request: {
                id: request.id,
                status: request.status,
                subStatus: request.subStatus,
                crmStatus: request.crmStatus,
                caseType: request.caseType,
                caseSummary: request.caseSummary,
                isHot: request.isHot,
                workerId: request.workerId,
                lawyerProfileId: request.lawyerProfileId,
                workerName: request.worker?.fullName || 'Trabajador',
                lawyerName: request.lawyerProfile?.lawyer?.user?.fullName || 'Abogado',
                lastWorkerActivityAt: request.lastWorkerActivityAt,
                lastLawyerActivityAt: request.lastLawyerActivityAt,
                canReassignLawyer,
                canArchiveCase,
                businessDaysSinceWorkerActivity,
                workerDaysSinceLawyerActivity
            }
        });

    } catch (error: any) {
        console.error('Error getting request info:', error);
        res.status(500).json({ error: 'Error al obtener información de la solicitud' });
    }
};

/**
 * POST: Client requests change of lawyer due to inactivity (5 business days)
 */
export const reassignLawyer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const request = await prisma.contactRequest.findUnique({
            where: { id },
            include: {
                lawyerProfile: {
                    include: {
                        lawyer: { include: { user: true } }
                    }
                }
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (request.workerId !== userId) {
            return res.status(403).json({ error: 'No autorizado: solo el propietario del caso puede solicitar reasignación' });
        }

        if (request.status !== 'accepted') {
            return res.status(400).json({ error: 'El caso debe estar aceptado para solicitar reasignación' });
        }

        // Validate 5 business days since last worker activity
        if (!request.lastWorkerActivityAt) {
            return res.status(400).json({ error: 'No hay registro de actividad del trabajador' });
        }

        const businessDays = getBusinessDaysDiff(request.lastWorkerActivityAt, new Date());
        if (businessDays < 5) {
            return res.status(400).json({ 
                error: `Aún no se cumplen los 5 días hábiles de inactividad del abogado. Días transcurridos: ${businessDays}` 
            });
        }

        const originalLawyerProfileId = request.lawyerProfileId;
        const lawyerUserId = request.lawyerProfile?.lawyer?.userId;

        // Update request: unassign lawyer, record in previousLawyerIds, set back to pending
        const updatedPreviousLawyers = request.previousLawyerIds 
            ? `${request.previousLawyerIds},${originalLawyerProfileId}` 
            : `${originalLawyerProfileId}`;

        await prisma.$transaction([
            prisma.contactRequest.update({
                where: { id },
                data: {
                    lawyerProfileId: null,
                    status: 'pending',
                    subStatus: 'waiting_lawyer',
                    crmStatus: 'NEW',
                    previousLawyerIds: updatedPreviousLawyers,
                    lastWorkerActivityAt: new Date(), // Reset to top
                    lastLawyerActivityAt: null,
                    expiresAt: null // Pool cases have no expiration
                }
            }),
            prisma.chatMessage.create({
                data: {
                    requestId: id,
                    senderId: userId,
                    content: '🔄 **Sistema:** El cliente ha solicitado la reasignación de este caso debido a inactividad del abogado anterior. El caso ha regresado a la bolsa pública de abogados.',
                    type: 'system_notification'
                }
            })
        ]);

        // Notifications
        if (lawyerUserId) {
            sendPushNotification(
                lawyerUserId,
                '⚠️ Caso Reasignado',
                'Un caso activo ha sido reasignado debido a inactividad prolongada.',
                { type: 'case_reassigned', requestId: id }
            ).catch(err => console.error('[Push] Error notifying lawyer of reassignment:', err));
        }

        // Notify other active, verified lawyers
        const activeLawyers = await prisma.lawyer.findMany({
            where: { isVerified: true, status: { not: 'SUSPENDED' } },
            include: { user: true, profile: true }
        });

        for (const lawyer of activeLawyers) {
            if (lawyer.profile && lawyer.profile.id !== originalLawyerProfileId && lawyer.userId) {
                sendPushNotification(
                    lawyer.userId,
                    '🔄 Nuevo Caso Disponible',
                    'Hay una solicitud de asesoría laboral disponible en la bolsa pública.',
                    { type: 'public_case', requestId: id }
                ).catch(err => console.error('[Push] Error notifying public pool:', err));
            }
        }

        res.json({ success: true, message: 'El caso ha sido regresado a la bolsa pública de abogados.' });

    } catch (error: any) {
        console.error('Error reassigning lawyer:', error);
        res.status(500).json({ error: 'Error al reasignar abogado' });
    }
};

/**
 * POST: Lawyer archives case due to worker inactivity (7 worker days)
 */
export const archiveInactiveCase = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });

        if (!lawyer || !lawyer.profile) {
            return res.status(404).json({ error: 'Perfil de abogado no encontrado' });
        }

        const request = await prisma.contactRequest.findUnique({
            where: { id }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (request.lawyerProfileId !== lawyer.profile.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (request.status !== 'accepted') {
            return res.status(400).json({ error: 'El caso debe estar aceptado para archivarlo' });
        }

        // Validate 7 worker business days of inactivity
        if (!request.lastLawyerActivityAt) {
            return res.status(400).json({ error: 'No hay registro de actividad del abogado' });
        }

        const workerDays = getWorkerDaysDiff(request.lastLawyerActivityAt, new Date());
        if (workerDays < 7) {
            return res.status(400).json({ 
                error: `Aún no se cumplen los 7 días de inactividad del trabajador. Días transcurridos: ${workerDays}` 
            });
        }

        await prisma.$transaction([
            prisma.contactRequest.update({
                where: { id },
                data: {
                    status: 'archived',
                    subStatus: 'archived',
                    crmStatus: 'CLOSED_LOST',
                    closedAt: new Date()
                }
            }),
            prisma.chatMessage.create({
                data: {
                    requestId: id,
                    senderId: userId,
                    content: '💼 **Sistema:** El caso ha sido cerrado y archivado debido a inactividad prolongada del trabajador.',
                    type: 'system_notification'
                }
            })
        ]);

        // Notify worker
        sendPushNotification(
            request.workerId,
            '📁 Caso Archivado por Inactividad',
            'Tu caso fue archivado por inactividad. Si deseas reactivarlo, por favor contáctanos.',
            { type: 'case_archived', requestId: id }
        ).catch(err => console.error('[Push] Error notifying worker of archiving:', err));

        res.json({ success: true, message: 'El caso ha sido archivado exitosamente.' });

    } catch (error: any) {
        console.error('Error archiving case:', error);
        res.status(500).json({ error: 'Error al archivar caso' });
    }
};
