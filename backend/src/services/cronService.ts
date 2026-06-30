import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { startScheduler as startNewsScheduler } from './newsScheduler';
import { addBusinessDays, getBusinessDaysDiff, getWorkerDaysDiff } from '../utils/businessDays';
import { sendPushNotification } from './notificationService';

const prisma = new PrismaClient();

// Start News Scheduler
startNewsScheduler();

// Se ejecuta todos los días a las 2:00 AM
cron.schedule('0 2 * * *', async () => {
    console.log('🤖 [CRON] Iniciando revisión nocturna de SLAs (Sistemas de Inactividad)...');

    try {
        const now = new Date();

        // 1. REASIGNACIÓN AUTOMÁTICA DE CASOS EXPIRADOS (3 días hábiles para aceptar)
        const expiredPending = await prisma.contactRequest.findMany({
            where: {
                status: 'pending',
                lawyerProfileId: { not: null },
                expiresAt: { lt: now }
            },
            include: {
                lawyerProfile: {
                    include: { lawyer: { include: { user: true } } }
                }
            }
        });

        console.log(`⚠️ [CRON] Detectados ${expiredPending.length} casos expirados sin aceptación.`);

        for (const req of expiredPending) {
            const originalLawyerProfileId = req.lawyerProfileId;
            const lawyerUserId = req.lawyerProfile?.lawyer?.userId;
            const updatedPreviousLawyers = req.previousLawyerIds 
                ? `${req.previousLawyerIds},${originalLawyerProfileId}` 
                : `${originalLawyerProfileId}`;

            await prisma.$transaction([
                prisma.contactRequest.update({
                    where: { id: req.id },
                    data: {
                        lawyerProfileId: null,
                        previousLawyerIds: updatedPreviousLawyers,
                        status: 'pending',
                        subStatus: 'waiting_lawyer',
                        expiresAt: null // Sin expiración en bolsa pública
                    }
                }),
                prisma.chatMessage.create({
                    data: {
                        requestId: req.id,
                        senderId: req.workerId,
                        content: '🔄 **Sistema:** El abogado original no aceptó el caso dentro de los 3 días hábiles correspondientes. El caso ha sido transferido a la bolsa pública de abogados.',
                        type: 'system_notification'
                    }
                })
            ]);

            // Notificar al abogado original
            if (lawyerUserId) {
                await sendPushNotification(
                    lawyerUserId,
                    '⚠️ Solicitud Expirada',
                    'Una solicitud de asesoría ha expirado por no ser aceptada en 3 días hábiles.',
                    { type: 'case_expired', requestId: req.id }
                ).catch(err => console.error('[Push] Error notifying lawyer:', err));
            }

            // Notificar al trabajador
            await sendPushNotification(
                req.workerId,
                '🔄 Buscando Nuevo Abogado',
                'Tu solicitud anterior expiró sin respuesta del abogado asignado. Hemos colocado tu caso en la bolsa pública.',
                { type: 'reassignment', requestId: req.id }
            ).catch(err => console.error('[Push] Error notifying worker:', err));

            // Notificar a otros abogados activos y verificados
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
                        { type: 'public_case', requestId: req.id }
                    ).catch(err => console.error('[Push] Error notifying public pool:', err));
                }
            }
        }

        // 2. MONITOREO DE INACTIVIDAD DEL ABOGADO (3 y 5 días hábiles)
        const lawyerWaitingCases = await prisma.contactRequest.findMany({
            where: {
                status: 'accepted',
                subStatus: 'waiting_lawyer_response',
                crmStatus: { notIn: ['CLOSED_WON', 'CLOSED_LOST', 'ARCHIVED'] }
            },
            include: {
                lawyerProfile: {
                    include: { lawyer: { include: { user: true } } }
                }
            }
        });

        for (const req of lawyerWaitingCases) {
            if (!req.lastWorkerActivityAt || !req.lawyerProfile?.lawyer?.userId) continue;

            const daysDiff = getBusinessDaysDiff(req.lastWorkerActivityAt, now);

            if (daysDiff === 3) {
                // Nudge abogado e IA mensaje de advertencia
                await prisma.chatMessage.create({
                    data: {
                        requestId: req.id,
                        senderId: req.lawyerProfile.lawyer.userId,
                        content: `🟡 **Semáforo Amarillo:** Tu abogado lleva 3 días hábiles sin actividad. Elías (IA) ha enviado un recordatorio prioritario para reactivar el caso.`,
                        type: 'ai_response'
                    }
                });

                await sendPushNotification(
                    req.lawyerProfile.lawyer.userId,
                    '⏰ Recordatorio de Caso',
                    'Tienes un caso pendiente de responder desde hace 3 días hábiles. ¡Mantén tu ritmo!',
                    { type: 'lawyer_nudge', requestId: req.id }
                ).catch(err => console.error('[Push] Error notifying lawyer nudge:', err));
            } else if (daysDiff >= 5) {
                // Notificar al trabajador que ya puede reasignar el caso
                await sendPushNotification(
                    req.workerId,
                    '🔄 Opción de Cambio de Abogado Habilitada',
                    'Tu caso lleva 5 días hábiles sin actividad del abogado. Ya puedes solicitar la reasignación de tu abogado desde el chat.',
                    { type: 'can_reassign', requestId: req.id }
                ).catch(err => console.error('[Push] Error notifying worker reassign option:', err));
            }
        }

        // 3. MONITOREO DE INACTIVIDAD DEL TRABAJADOR (5 y 7 días laborables, excluyendo domingos)
        const workerWaitingCases = await prisma.contactRequest.findMany({
            where: {
                status: 'accepted',
                subStatus: 'waiting_worker_response',
                crmStatus: { notIn: ['CLOSED_WON', 'CLOSED_LOST', 'ARCHIVED'] }
            },
            include: {
                lawyerProfile: {
                    include: { lawyer: { include: { user: true } } }
                }
            }
        });

        for (const req of workerWaitingCases) {
            if (!req.lastLawyerActivityAt || !req.lawyerProfile?.lawyer?.userId) continue;

            const daysDiff = getWorkerDaysDiff(req.lastLawyerActivityAt, now);

            if (daysDiff === 5) {
                // Recordatorio al trabajador
                await sendPushNotification(
                    req.workerId,
                    '⏰ Recordatorio de Asesoría',
                    'Tu abogado está esperando tu respuesta para continuar con tu caso laboral.',
                    { type: 'worker_nudge', requestId: req.id }
                ).catch(err => console.error('[Push] Error notifying worker nudge:', err));
            } else if (daysDiff >= 7) {
                // Notificar al abogado que puede archivar
                await sendPushNotification(
                    req.lawyerProfile.lawyer.userId,
                    '📁 Opción de Archivado Habilitada',
                    'El trabajador lleva 7 días laborables sin responder. Ya puedes archivar el caso por inactividad desde el chat.',
                    { type: 'can_archive', requestId: req.id }
                ).catch(err => console.error('[Push] Error notifying lawyer archive option:', err));
            }
        }

        // 4. \ud83d\udcb3 RECORDATORIO DE RENOVACIÓN DE MEMBRESÍA (7 días antes del vencimiento)
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const eightDaysFromNow = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

        const expiringLawyers = await prisma.lawyer.findMany({
            where: {
                subscriptionStatus: 'active',
                subscriptionEndDate: {
                    gte: sevenDaysFromNow,
                    lt: eightDaysFromNow // Only notify on the 7-day mark (not every day)
                }
            },
            include: { subscription: true }
        });

        console.log(`\u23f0 [CRON] ${expiringLawyers.length} abogados con membresía próxima a vencer en 7 días.`);

        for (const lawyer of expiringLawyers) {
            if (!lawyer.userId) continue;
            const planName = lawyer.subscription?.plan === 'pro' ? 'Pro ($599/mes)' : 'Básica ($299/mes)';
            await sendPushNotification(
                lawyer.userId,
                '\u23f3 Tu membresía vence en 7 días',
                `Tu membresía ${planName} vence el ${lawyer.subscriptionEndDate?.toLocaleDateString('es-MX')}. Renueva para seguir recibiendo casos.`,
                { type: 'subscription_expiring', daysLeft: 7 }
            ).catch(err => console.error('[Push] Error notifying lawyer renewal:', err));
        }

        // 5. NOTIFICACIONES PREVENTIVAS Y ESTACIONALES
        const month = now.getMonth(); // 0 = Enero, 4 = Mayo, 11 = Diciembre
        const date = now.getDate();
        let seasonalTitle = '';
        let seasonalBody = '';

        if (month === 4 && date === 15) { // 15 de Mayo
            seasonalTitle = '💰 ¿Ya recibiste tu reparto de utilidades (PTU)?';
            seasonalBody = 'Recuerda que la fecha límite es el 30 de mayo. Revisa tus derechos y realiza tu estimación aquí.';
        } else if (month === 11 && date === 10) { // 10 de Diciembre
            seasonalTitle = '🗞️ ¡Se acerca el pago de tu Aguinaldo!';
            seasonalBody = 'Los patrones tienen hasta el 20 de diciembre para pagarlo. Calcula cuánto te corresponde en Aliado Laboral.';
        } else if (month === 3 && date === 15) { // 15 de Abril
            seasonalTitle = '📅 Declaración Anual y Deducciones';
            seasonalBody = '¿Sabías que como asalariado puedes deducir colegiaturas y gastos médicos? Conoce cómo tener saldo a favor.';
        }

        if (seasonalTitle && seasonalBody) {
            console.log(`📢 [CRON] Enviando notificación preventiva estacional: "${seasonalTitle}"`);
            const usersWithTokens = await prisma.user.findMany({
                where: { pushToken: { not: null } },
                select: { id: true }
            });
            
            for (const user of usersWithTokens) {
                sendPushNotification(user.id, seasonalTitle, seasonalBody, { type: 'seasonal' })
                    .catch(err => console.error(`Error sending seasonal notification to ${user.id}:`, err));
            }
        }

        console.log('✅ [CRON] Revisión nocturna de SLAs completada.');
    } catch (error) {
        console.error('❌ [CRON] Error ejecutando la revisión de SLAs:', error);
    }
});
