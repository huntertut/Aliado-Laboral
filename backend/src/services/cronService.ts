import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { startScheduler as startNewsScheduler } from './newsScheduler';

const prisma = new PrismaClient();

// Start News Scheduler
startNewsScheduler();

// Se ejecuta todos los días a las 2:00 AM
cron.schedule('0 2 * * *', async () => {
    console.log('🤖 [CRON] Iniciando revisión nocturna de SLAs de Abogados...');

    try {
        const now = new Date();

        // Regla 1: 24 Horas sin contactar (Strike + Reasignación)
        // Buscamos casos aceptados que sigan en CRM 'NEW' despues de 24h
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const neglectedRequests = await prisma.contactRequest.findMany({
            where: {
                status: 'accepted',
                crmStatus: 'NEW',
                acceptedAt: {
                    lt: twentyFourHoursAgo
                }
            },
            include: {
                lawyerProfile: {
                    include: { lawyer: true }
                }
            }
        });

        for (const req of neglectedRequests) {
            if (req.lawyerProfile?.lawyerId) {
                // 1. Quitarle el caso
                await prisma.contactRequest.update({
                    where: { id: req.id },
                    data: {
                        status: 'pending', // Regresa a la bolsa pública
                        crmStatus: 'NEW',
                        lawyerProfileId: null, // Desasignar
                        lastLawyerActivityAt: null,
                        subStatus: 'waiting_lawyer'
                    }
                });

                // 2. Sumar 1 Strike al abogado
                const updatedLawyer = await prisma.lawyer.update({
                    where: { id: req.lawyerProfile.lawyerId },
                    data: { strikes: { increment: 1 } }
                });

                console.log(`⚠️ [CRON] Caso ${req.id} reasignado. Strike aplicado al abogado ${req.lawyerProfile.lawyerId}. Strikes totales: ${updatedLawyer.strikes}`);

                // 3. Tolerancia Cero: Suspender si llega a 3 strikes
                if (updatedLawyer.strikes >= 3 && updatedLawyer.status !== 'SUSPENDED') {
                    await prisma.lawyer.update({
                        where: { id: updatedLawyer.id },
                        data: { status: 'SUSPENDED' }
                    });
                    console.log(`⛔ [CRON] Abogado ${updatedLawyer.id} SUSPENDIDO por acumular 3 strikes.`);

                    await prisma.adminAlert.create({
                        data: {
                            type: 'lawyer_suspended',
                            message: `El abogado con ID ${updatedLawyer.id} fue suspendido automáticamente por acumular 3 strikes de inactividad.`,
                            severity: 'high',
                            relatedUserId: updatedLawyer.userId
                        }
                    });
                }
            }
        }

        // Regla 2: 5 Días sin actividad (Semáforo Rojo)
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

        const staleRequests = await prisma.contactRequest.findMany({
            where: {
                status: 'accepted',
                crmStatus: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
                lastLawyerActivityAt: { lt: fiveDaysAgo },
                subStatus: { not: 'needs_attention' }
            }
        });

        for (const req of staleRequests) {
            await prisma.contactRequest.update({
                where: { id: req.id },
                data: { subStatus: 'needs_attention' }
            });
            console.log(`🔴 [CRON] Caso ${req.id} marcado con Semáforo Rojo (needs_attention).`);
        }

        console.log('✅ [CRON] Revisión nocturna completada.');
    } catch (error) {
        console.error('❌ [CRON] Error ejecutando la revisión de SLAs:', error);
    }
});
