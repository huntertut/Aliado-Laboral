import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Re-export modularized endpoints for backwards compatibility and router integrity
export { getDashboardStats, getFinancialStats } from './adminStatsController';
export { getLawyers, verifyLawyer, getWorkers, getPymes, addStrikeToLawyer, updateUserSubscription } from './adminUserController';
export { getAllCases, getPublicPoolCases, getSecurityLogs, getAdminAlerts, resolveAlert, purgeCaseData, getVaultCompliance } from './adminCasesController';

export const updateAdminPassword = async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!validPassword) {
            return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
        }

        const SALT_ROUNDS = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash }
        });

        res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error updating admin password:', error);
        res.status(500).json({ error: 'Failed to update admin password' });
    }
};

import admin from '../config/firebase';

export const syncFirebaseLawyers = async (req: Request, res: Response) => {
    try {
        console.log('[Admin] Starting Full Firebase Users Sync (Auth listUsers + Custom Claims)...');
        let newWorkersCount = 0;
        let newLawyersCount = 0;
        let newPymesCount = 0;
        let repairedCount = 0;
        let skippedCount = 0;
        let errorsCount = 0;

        // 1. Fetch all users from Firebase Auth via Admin SDK (handles pagination up to 1000 users per page)
        let nextPageToken: string | undefined = undefined;
        const allFirebaseUsers: any[] = [];

        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            allFirebaseUsers.push(...listUsersResult.users);
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        console.log(`[Admin] Retrieved ${allFirebaseUsers.length} total users from Firebase Auth.`);

        for (const fbUser of allFirebaseUsers) {
            try {
                const email = fbUser.email?.toLowerCase();
                const uid = fbUser.uid;
                if (!email) {
                    skippedCount++;
                    continue;
                }

                // 2. Check Custom Claims & UserRole table for role preference
                const customClaimRole = fbUser.customClaims?.role;
                const existingUserRole = await prisma.userRole.findUnique({ where: { firebaseUid: uid } });
                
                // Determine target role from Firebase or default to worker
                let targetRole = customClaimRole || existingUserRole?.role || 'worker';

                // 3. Find if user exists in SQL DB
                let existingUser = await prisma.user.findFirst({
                    where: { OR: [{ email }, { id: existingUserRole?.userId || '___none___' }] },
                    include: { lawyerProfile: true, workerSubscription: true, pymeProfile: true }
                });

                if (!existingUser) {
                    // Create new user in SQL DB with verified role
                    console.log(`[Admin] Creating missing User in SQL for Firebase user: ${email} (Role: ${targetRole})`);
                    existingUser = await prisma.user.create({
                        data: {
                            email,
                            fullName: fbUser.displayName || email.split('@')[0],
                            role: targetRole,
                            passwordHash: 'firebase_managed',
                            plan: targetRole === 'worker' ? 'free' : undefined,
                            profileStatus: 'active'
                        },
                        include: { lawyerProfile: true, workerSubscription: true, pymeProfile: true }
                    });

                    if (targetRole === 'worker') newWorkersCount++;
                    else if (targetRole === 'lawyer') newLawyersCount++;
                    else if (targetRole === 'pyme') newPymesCount++;
                } else {
                    // PRESERVE EXISTING USER ROLE IN SQL — NEVER OVERWRITE EXISTING ROLE!
                    targetRole = existingUser.role;
                }

                // 4. Ensure sub-table exists according to preserved User.role
                if (targetRole === 'lawyer' && !existingUser.lawyerProfile) {
                    await prisma.lawyer.create({
                        data: {
                            userId: existingUser.id,
                            licenseNumber: `SYNC_${existingUser.id.substring(0, 8)}`,
                            professionalName: existingUser.fullName,
                            specialty: 'Pendiente de asignar',
                            status: 'PENDING',
                            isVerified: false,
                            subscriptionStatus: 'inactive'
                        }
                    });
                    repairedCount++;
                } else if (targetRole === 'worker' && !existingUser.workerSubscription) {
                    await prisma.workerSubscription.create({
                        data: {
                            userId: existingUser.id,
                            status: 'inactive',
                            amount: 0.0,
                            autoRenew: false
                        }
                    });
                    repairedCount++;
                } else if (targetRole === 'pyme' && !existingUser.pymeProfile) {
                    await prisma.pymeProfile.create({
                        data: {
                            userId: existingUser.id,
                            razonSocial: existingUser.fullName || 'Empresa PyME',
                            industry: 'General'
                        }
                    });
                    repairedCount++;
                } else {
                    skippedCount++;
                }

                // 5. Ensure UserRole mapping is in sync
                if (existingUserRole) {
                    await prisma.userRole.update({
                        where: { id: existingUserRole.id },
                        data: { userId: existingUser.id, role: targetRole, email }
                    });
                } else {
                    await prisma.userRole.create({
                        data: {
                            firebaseUid: uid,
                            userId: existingUser.id,
                            role: targetRole,
                            email,
                            fullName: existingUser.fullName
                        }
                    });
                }

                // 6. Ensure Custom Claim is synced on Firebase Auth
                if (fbUser.customClaims?.role !== targetRole) {
                    await admin.auth().setCustomUserClaims(uid, { role: targetRole }).catch(() => {});
                }

            } catch (userErr) {
                console.error(`[Admin] Error syncing user ${fbUser.email}:`, userErr);
                errorsCount++;
            }
        }

        res.json({
            success: true,
            stats: {
                totalFirebaseUsers: allFirebaseUsers.length,
                newWorkers: newWorkersCount,
                newLawyers: newLawyersCount,
                newPymes: newPymesCount,
                repairedProfiles: repairedCount,
                skipped: skippedCount,
                errors: errorsCount
            },
            message: `Sincronización completada. Se procesaron ${allFirebaseUsers.length} usuarios de Firebase (${newWorkersCount} trabajadores nuevos, ${newLawyersCount} abogados nuevos, ${repairedCount} perfiles reparados).`
        });
    } catch (error) {
        console.error('Error during full Firebase sync:', error);
        res.status(500).json({ error: 'Failed to sync Firebase users' });
    }
};

/**
 * Re-broadcast latest news notification to all active push tokens
 */
export const broadcastLatestNews = async (req: Request, res: Response) => {
    try {
        const latestNews = await prisma.legalNews.findFirst({
            where: { isPublished: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!latestNews) {
            return res.status(404).json({ error: 'No hay noticias publicadas para emitir.' });
        }

        const users = await prisma.user.findMany({
            where: { pushToken: { not: null } },
            select: { id: true, pushToken: true }
        });

        console.log(`📢 [Admin] Re-broadcasting news "${latestNews.titleClickable}" to ${users.length} users with push token...`);

        if (users.length === 0) {
            return res.json({
                success: true,
                message: 'No hay usuarios con Push Token activo registrados aún en la base de datos.',
                activeTokensCount: 0
            });
        }

        const { Expo } = await import('expo-server-sdk');
        const expo = new Expo();
        const title = "🗞️ Nueva Noticia Laboral";
        const body = latestNews.titleClickable || "Actualización importante sobre la LFT.";
        const data = { type: 'news', newsId: latestNews.id };

        const messages = users
            .filter(u => u.pushToken && Expo.isExpoPushToken(u.pushToken))
            .map(u => ({ to: u.pushToken!, sound: 'default' as const, title, body, data }));

        const chunks = expo.chunkPushNotifications(messages);
        const ticketResults: any[] = [];

        for (const chunk of chunks) {
            try {
                const tickets = await expo.sendPushNotificationsAsync(chunk);
                ticketResults.push(...tickets);
            } catch (err) {
                console.error('[Admin] Error sending push chunk:', err);
            }
        }

        const okTickets = ticketResults.filter(t => t.status === 'ok');
        const errorTickets = ticketResults.filter(t => t.status === 'error');

        console.log(`📢 [Admin] Push results: ${okTickets.length} OK, ${errorTickets.length} Errors out of ${messages.length} valid Expo tokens.`);
        
        // Fetch delivery receipts from FCM/APNs (Expo Push Receipts)
        const ticketIds = ticketResults.filter(t => t.status === 'ok' && t.id).map(t => t.id);
        let receiptErrors: any[] = [];
        let receiptsResult: any = {};

        if (ticketIds.length > 0) {
            console.log(`📢 [Admin] Waiting 2.5s for FCM delivery receipts for ${ticketIds.length} tickets...`);
            await new Promise(r => setTimeout(r, 2500));
            try {
                const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
                for (const chunk of receiptIdChunks) {
                    const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
                    console.log('📢 [Admin] Push Receipts:', JSON.stringify(receipts));
                    receiptsResult = { ...receiptsResult, ...receipts };
                    
                    for (const [id, receipt] of Object.entries(receipts as Record<string, any>)) {
                        if (receipt.status === 'error') {
                            receiptErrors.push({ id, message: receipt.message, details: receipt.details });
                        }
                    }
                }
            } catch (rErr) {
                console.error('[Admin] Error fetching receipts:', rErr);
            }
        }

        res.json({
            success: true,
            message: receiptErrors.length > 0 
                ? `Expo envió la notif pero FCM dio error: ${receiptErrors[0]?.details?.error || receiptErrors[0]?.message}` 
                : `Notificación procesada: ${okTickets.length} entregadas a Expo Push.`,
            activeTokensCount: users.length,
            validExpoTokensCount: messages.length,
            okTicketsCount: okTickets.length,
            errorTicketsCount: errorTickets.length,
            receiptErrorsCount: receiptErrors.length,
            receiptErrors: receiptErrors,
            receipts: receiptsResult,
            newsTitle: latestNews.titleClickable,
            tickets: ticketResults
        });

    } catch (error) {
        console.error('Error re-broadcasting news:', error);
        res.status(500).json({ error: 'Error al reemitir noticia' });
    }
};

export const getPaymentLogs = async (req: Request, res: Response) => {
    try {
        // 1. Worker Subscriptions
        const subs = await prisma.workerSubscription.findMany({
            include: { user: { select: { email: true, fullName: true } } },
            orderBy: { startDate: 'desc' },
            take: 20
        });

        const subLogs = subs.map(sub => ({
            id: sub.id,
            type: 'Subscription',
            user: sub.user.email,
            amount: 29,
            status: sub.status === 'active' ? 'success' : 'failed',
            date: sub.startDate,
            gateway: 'Stripe'
        }));

        // 2. Contact Requests
        const contacts = await prisma.contactRequest.findMany({
            include: {
                worker: { select: { email: true } },
                lawyerProfile: { include: { lawyer: { include: { user: { select: { email: true } } } } } }
            },
            where: { status: 'accepted' },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        const contactLogs = contacts.map(contact => ({
            id: contact.id,
            type: 'Contact Fee',
            user: `${contact.worker.email} & ${contact.lawyerProfile?.lawyer?.user?.email || 'N/A'}`,
            amount: 200,
            status: contact.bothPaymentsSucceeded ? 'success' : 'pending',
            date: contact.createdAt,
            gateway: 'Mixed'
        }));

        const allLogs = [...subLogs, ...contactLogs]
            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
            .slice(0, 50);

        res.json(allLogs);
    } catch (error) {
        console.error('Get payment logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
