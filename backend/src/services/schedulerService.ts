import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from './notificationService';

const prisma = new PrismaClient();

/**
 * JOB: Supervisor Automático (Cada Hora)
 * - Detecta casos "abandonados" (24h sin respuesta del abogado).
 * - Aplica Strike al abogado.
 * - Libera el caso para otros abogados.
 */
export const checkLawyerInactivity = async () => {
    console.log('👮 [Scheduler] Checking for Lawyer Inactivity...');

    const now = new Date();
    const deadline = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    try {
        // Find accepted cases where lawyer hasn't acted in 24h
        const abandonedCases = await prisma.contactRequest.findMany({
            where: {
                status: 'accepted',
                subStatus: 'chat_active',
                lastLawyerActivityAt: {
                    lt: deadline
                }
            },
            include: {
                lawyerProfile: {
                    include: {
                        lawyer: {
                            include: { user: true }
                        }
                    }
                },
                worker: true
            }
        });

        console.log(`⚠️ [Scheduler] Found ${abandonedCases.length} abandoned cases.`);

        for (const request of abandonedCases) {
            const lawyer = request.lawyerProfile?.lawyer;
            if (!lawyer) continue;

            console.log(`🚫 Penalizing Lawyer: ${lawyer.user.fullName} for Case ${request.id}`);

            // 1. APPLY STRIKE & UPDATE STATUS (Transactional)
            await prisma.$transaction(async (tx) => {
                // Increment Strikes
                const updatedLawyer = await tx.lawyer.update({
                    where: { id: lawyer.id },
                    data: {
                        strikes: { increment: 1 }
                    }
                });

                // Auto-Suspend if 3 Strikes
                if (updatedLawyer.strikes >= 3) {
                    await tx.lawyer.update({
                        where: { id: lawyer.id },
                        data: { status: 'SUSPENDED' }
                    });
                    console.log(`🛑 LAWYER SUSPENDED: ${lawyer.user.fullName}`);
                }

                // Release Case
                await tx.contactRequest.update({
                    where: { id: request.id },
                    data: {
                        status: 'pending',        // Back to pool
                        subStatus: 'waiting_lawyer',
                        lawyerProfileId: null,    // Unassign
                        rejectionReason: 'TIMEOUT_24H_AUTO', // System reason
                        rejectionCount: { increment: 1 },
                        lastWorkerActivityAt: new Date() // Bump to top of list
                    }
                });
            });

            // 2. NOTIFY PARTIES

            // Notify Lawyer (Bad News)
            await sendPushNotification(
                lawyer.userId,
                "⚠️ Strike Aplicado: Inactividad",
                "Has perdido un caso por no responder en 24h. Se te ha aplicado un reporte.",
                { type: 'strike_alert', lawyerId: lawyer.id }
            );

            // Notify Worker (Good News/Reassurance)
            if (request.worker.pushToken) {
                await sendPushNotification(
                    request.workerId,
                    "🔄 Reasignando Abogado",
                    "Tu abogado anterior no respondió a tiempo. Estamos buscando uno nuevo con mayor disponibilidad.",
                    { type: 'reassignment', requestId: request.id }
                );
            }
        }

    } catch (error) {
        console.error('❌ [Scheduler] Error in checkLawyerInactivity:', error);
    }
};

/**
 * Start all Cron Jobs
 */
export const startScheduler = () => {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', () => {
        checkLawyerInactivity();
    });

    console.log('⏰ [Scheduler] "Vaporware Be Gone" Services Started.');
};
