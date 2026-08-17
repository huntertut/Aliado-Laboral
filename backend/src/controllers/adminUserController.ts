import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from '../services/notificationService';
import admin from '../config/firebase';

const prisma = new PrismaClient();


export const getLawyers = async (req: Request, res: Response) => {
    try {
        const lawyers = await prisma.lawyer.findMany({
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        createdAt: true,
                        _count: { select: { legalCases: { where: { status: 'active' } } } }
                    }
                },
                subscription: true
            },
            orderBy: { user: { createdAt: 'desc' } }
        });

        // Format for frontend
        const formattedLawyers = lawyers.map(lawyer => {
            const l = lawyer as any;
            return {
                id: l.id,
                userId: l.userId,
                fullName: l.user.fullName,
                email: l.user.email,
                isVerified: l.isVerified,
                licenseNumber: l.licenseNumber,
                subscriptionStatus: l.subscriptionStatus || 'inactive',
                planExpiresAt: l.subscriptionEndDate,
                activeCasesCount: l.user._count?.legalCases || 0,
                createdAt: l.user.createdAt
            };
        });

        res.json(formattedLawyers);
    } catch (error) {
        console.error('Get lawyers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyLawyer = async (req: Request, res: Response) => {
    try {
        const { lawyerId } = req.params;
        const { isVerified } = req.body;

        const lawyer = await prisma.lawyer.update({
            where: { id: lawyerId },
            data: { isVerified },
            include: { user: true }
        });

        // Enviar Push Notification si fue aprobado
        if (isVerified === true && lawyer.user?.id) {
            console.log(`[AdminController] Enviando notificación de aprobación al abogado ${lawyer.user.id}`);
            await sendPushNotification(
                lawyer.user.id,
                '¡Cuenta Aprobada!',
                'Felicidades, tu cuenta de Aliado Laboral ha sido verificada. Ya puedes iniciar sesión y acceder a casos.',
                { type: 'LAWYER_VERIFIED' }
            );
        }

        res.json(lawyer);
    } catch (error) {
        console.error('Verify lawyer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getWorkers = async (req: Request, res: Response) => {
    try {
        const workers = await prisma.user.findMany({
            where: { role: 'worker' },
            include: {
                workerSubscription: true,
                _count: {
                    select: { 
                        contactRequestsSent: true,
                        legalCases: { where: { status: 'active' } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedWorkers = workers.map(worker => ({
            id: worker.id,
            fullName: worker.fullName,
            email: worker.email,
            subscriptionStatus: worker.workerSubscription?.status || 'free',
            planExpiresAt: worker.workerSubscription?.endDate || null,
            activeCasesCount: worker._count.legalCases,
            contactRequests: worker._count.contactRequestsSent,
            createdAt: worker.createdAt
        }));

        res.json(formattedWorkers);
    } catch (error) {
        console.error('Get workers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPymes = async (req: Request, res: Response) => {
    try {
        const pymes = await prisma.user.findMany({
            where: { role: 'pyme' },
            include: {
                pymeProfile: true,
                _count: {
                    select: { legalCases: { where: { status: 'active' } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedPymes = pymes.map(pyme => ({
            id: pyme.id,
            fullName: pyme.fullName,
            companyName: pyme.pymeProfile?.razonSocial || 'Sin Razón Social',
            email: pyme.email,
            plan: pyme.plan || 'basic',
            planExpiresAt: pyme.planExpiresAt,
            activeCasesCount: pyme._count.legalCases,
            subscriptionLevel: pyme.subscriptionLevel || 'basic',
            industry: pyme.pymeProfile?.industry || 'N/A',
            createdAt: pyme.createdAt
        }));

        res.json(formattedPymes);
    } catch (error) {
        console.error('Get pymes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * ⚖️ SISTEMA DE STRIKES (Tolerancia Cero)
 * Añade un strike manual a un abogado (Admin)
 */
export const addStrikeToLawyer = async (req: Request, res: Response) => {
    try {
        const { lawyerId } = req.params;
        const { reason } = req.body;

        const lawyer = await prisma.lawyer.findUnique({
            where: { id: lawyerId }
        });

        if (!lawyer) {
            return res.status(404).json({ error: 'Abogado no encontrado' });
        }

        const updatedLawyer = await prisma.lawyer.update({
            where: { id: lawyerId },
            data: { strikes: { increment: 1 } }
        });

        // Suspensión Automática al llegar a 3
        if (updatedLawyer.strikes >= 3 && updatedLawyer.status !== 'SUSPENDED') {
            await prisma.lawyer.update({
                where: { id: lawyerId },
                data: { status: 'SUSPENDED' }
            });

            await prisma.adminAlert.create({
                data: {
                    type: 'lawyer_suspended',
                    message: `Abogado ${lawyerId} suspendido por alcanzar 3 strikes (Razón del último: ${reason || 'Manual'}).`,
                    severity: 'high',
                    relatedUserId: updatedLawyer.userId
                }
            });
        }

        await prisma.activityLog.create({
            data: {
                userId: (req as any).user?.id,
                action: 'ADD_STRIKE',
                details: `Strike añadido a abogado ${lawyerId}. Razón: ${reason}. Total strikes: ${updatedLawyer.strikes}`,
                ipAddress: req.ip
            }
        });

        res.json({
            success: true,
            message: `Strike añadido correctamente. Total: ${updatedLawyer.strikes}`,
            lawyerStatus: updatedLawyer.strikes >= 3 ? 'SUSPENDED' : lawyer.status
        });

    } catch (error: any) {
        console.error('Error adding strike:', error);
        res.status(500).json({ error: 'Error interno del servidor al aplicar strike' });
    }
};

/**
 * Update User Subscription (Admin Manual Override)
 */
export const updateUserSubscription = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { plan, role, durationMonths = 1 } = req.body;

        console.log(`[Admin] Updating subscription for User ${userId} (${role}) to ${plan} for ${durationMonths} month(s)`);

        const now = new Date();
        const nextMonth = new Date();
        const duration = Number(durationMonths) || 1;
        nextMonth.setDate(now.getDate() + (30 * duration));

        // 1. Update User Record
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                plan: plan,
                subscriptionLevel: (plan === 'pro' || plan === 'premium') ? 'premium' : 'basic',
                planExpiresAt: (plan === 'pro' || plan === 'premium') ? nextMonth : null
            }
        });

        // 2. Update Role Specific Tables
        if (role === 'worker') {
            if (plan === 'premium' || plan === 'pro') {
                await prisma.workerSubscription.upsert({
                    where: { userId: userId },
                    update: { status: 'active', endDate: nextMonth },
                    create: {
                        userId: userId,
                        status: 'active',
                        amount: 29.00,
                        startDate: now,
                        endDate: nextMonth,
                        autoRenew: true
                    }
                });
            } else {
                // Downgrade
                await prisma.workerSubscription.updateMany({
                    where: { userId: userId },
                    data: { status: 'inactive' }
                });
            }
        } else if (role === 'lawyer') {
            const lawyer = await prisma.lawyer.findUnique({ where: { userId } });
            if (lawyer) {
                if (plan === 'pro' || plan === 'basic') {
                    await prisma.lawyer.update({
                        where: { id: lawyer.id },
                        data: { 
                            acceptsPymeClients: plan === 'pro',
                            subscriptionStatus: 'active',
                            subscriptionEndDate: nextMonth
                        }
                    });

                    await prisma.lawyerSubscription.upsert({
                        where: { lawyerId: lawyer.id },
                        update: {
                            status: 'active',
                            plan: plan,
                            endDate: nextMonth,
                            autoRenew: false
                        },
                        create: {
                            lawyerId: lawyer.id,
                            status: 'active',
                            plan: plan,
                            startDate: now,
                            endDate: nextMonth,
                            amount: plan === 'pro' ? 299.00 : 99.00,
                            autoRenew: false
                        }
                    });
                } else {
                    // Remove privileges
                    await prisma.lawyer.update({
                        where: { id: lawyer.id },
                        data: { 
                            acceptsPymeClients: false,
                            subscriptionStatus: 'inactive',
                            subscriptionEndDate: null
                        }
                    });
                    
                    await prisma.lawyerSubscription.updateMany({
                        where: { lawyerId: lawyer.id },
                        data: { status: 'inactive' }
                    });
                }
            }
        }

        // 3. 🛡️ ENSURE ROLE CONSISTENCY
        if (user.role !== role) {
            return res.status(400).json({
                error: 'Incompatibilidad de Roles',
                message: `Este usuario ya está registrado como ${user.role.toUpperCase()}. Un ${user.role} nunca podrá ser ${role.toUpperCase()} según la política de plataforma.`
            });
        }

        res.json({ success: true, message: `Plan actualizado a ${plan}`, user });
    } catch (error: any) {
        console.error('Update subscription error:', error);
        
        let errorDetails = 'Unknown error';
        if (error instanceof Error) {
            errorDetails = error.message;
        } else if (typeof error === 'string') {
            errorDetails = error;
        } else {
            try { errorDetails = JSON.stringify(error); } catch(e) {}
        }

        res.status(500).json({ 
            error: 'Error crítico en el servidor', 
            details: errorDetails,
            rawError: String(error)
        });
    }
};

/**
 * 🔄 Cambiar o corregir rol de un usuario (Admin)
 * Permite cambiar de worker a lawyer/pyme o viceversa, creando las tablas hijas necesarias
 * y sincronizando inmediatamente con Firebase Custom Claims y UserRole.
 */
export const changeUserRole = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { newRole } = req.body;

        if (!['worker', 'lawyer', 'pyme', 'admin'].includes(newRole)) {
            return res.status(400).json({ error: 'Rol inválido. Roles permitidos: worker, lawyer, pyme, admin' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { lawyerProfile: true, pymeProfile: true, workerSubscription: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log(`[Admin] Cambiando rol de usuario ${user.email} de ${user.role} a ${newRole}`);

        // 1. Update User.role en SQL
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                role: newRole,
                plan: newRole === 'lawyer' ? 'basic' : newRole === 'worker' ? 'free' : undefined
            }
        });

        // 2. Ensure sub-table exists for the new role
        if (newRole === 'lawyer') {
            let lawyer = await prisma.lawyer.findUnique({ where: { userId } });
            if (!lawyer) {
                lawyer = await prisma.lawyer.create({
                    data: {
                        userId,
                        licenseNumber: `LIC_${userId.substring(0, 8)}`,
                        professionalName: user.fullName || 'Abogado',
                        specialty: 'Derecho Laboral',
                        isVerified: true,
                        status: 'ACTIVE',
                        subscriptionStatus: 'active'
                    }
                });
                await prisma.lawyerProfile.create({
                    data: { lawyerId: lawyer.id, bio: 'Perfil de abogado verificado' }
                });
                await prisma.lawyerSubscription.create({
                    data: {
                        lawyerId: lawyer.id,
                        plan: 'basic',
                        status: 'active',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                });
            } else {
                await prisma.lawyer.update({
                    where: { id: lawyer.id },
                    data: { isVerified: true, status: 'ACTIVE', subscriptionStatus: 'active' }
                });
            }
        } else if (newRole === 'worker') {
            if (!user.workerSubscription) {
                await prisma.workerSubscription.create({
                    data: { userId, status: 'inactive', amount: 29.0, autoRenew: false }
                });
            }
        } else if (newRole === 'pyme') {
            if (!user.pymeProfile) {
                await prisma.pymeProfile.create({
                    data: {
                        userId,
                        razonSocial: user.fullName || 'Empresa PyME',
                        industry: 'General'
                    }
                });
            }
        }

        // 3. Sync Firebase Custom Claims & UserRole
        try {
            const userRole = await prisma.userRole.findFirst({ where: { OR: [{ userId }, { email: user.email }] } });
            if (userRole) {
                await prisma.userRole.update({
                    where: { id: userRole.id },
                    data: { role: newRole }
                });
                await admin.auth().setCustomUserClaims(userRole.firebaseUid, { role: newRole });
                console.log(`[changeUserRole] Claim ${newRole} asignado a UID ${userRole.firebaseUid}`);
            } else {
                const fbUser = await admin.auth().getUserByEmail(user.email).catch(() => null);
                if (fbUser) {
                    await admin.auth().setCustomUserClaims(fbUser.uid, { role: newRole });
                    await prisma.userRole.create({
                        data: {
                            firebaseUid: fbUser.uid,
                            userId: user.id,
                            email: user.email,
                            role: newRole,
                            fullName: user.fullName
                        }
                    });
                    console.log(`[changeUserRole] UserRole creado y claim ${newRole} asignado a Firebase UID ${fbUser.uid}`);
                }
            }
        } catch (fbErr: any) {
            console.warn('[changeUserRole] Error sincronizando claim en Firebase:', fbErr.message);
        }

        res.json({
            success: true,
            message: `Rol de ${user.email} actualizado exitosamente a ${newRole.toUpperCase()}.`,
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Error changing user role:', error);
        res.status(500).json({ error: 'Error al cambiar rol del usuario', details: error.message });
    }
};

/**
 * 🗑️ Eliminar Usuario Completo (Admin)
 * Elimina limpiamente todas las dependencias en SQL y elimina al usuario de Firebase Auth
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Find user by id or lawyer.id
        let user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            const lawyer = await prisma.lawyer.findUnique({ where: { id: userId } });
            if (lawyer) {
                user = await prisma.user.findUnique({ where: { id: lawyer.userId } });
            }
        }

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado en la base de datos' });
        }

        const targetUserId = user.id;
        const email = user.email;

        console.log(`[Admin] Iniciando eliminación completa del usuario ${email} (${targetUserId})`);

        // Transactional deletion of all dependent records
        await prisma.$transaction(async (tx) => {
            // 1. Lawyer relations
            const lawyer = await tx.lawyer.findUnique({ where: { userId: targetUserId } });
            if (lawyer) {
                await tx.lawyerProfile.deleteMany({ where: { lawyerId: lawyer.id } });
                await tx.lawyerSubscription.deleteMany({ where: { lawyerId: lawyer.id } });
                await tx.lawyerReview.deleteMany({ where: { lawyerId: lawyer.id } });
                await tx.contactRequest.deleteMany({ where: { lawyerProfileId: lawyer.id } });
                await tx.forumAnswer.deleteMany({ where: { lawyerId: lawyer.id } });
                await tx.lawyer.delete({ where: { id: lawyer.id } });
            }

            // 2. Worker relations
            await tx.workerProfile.deleteMany({ where: { userId: targetUserId } });
            await tx.workerSubscription.deleteMany({ where: { userId: targetUserId } });
            await tx.calculationRecord.deleteMany({ where: { userId: targetUserId } });
            await tx.contactRequest.deleteMany({ where: { workerId: targetUserId } });

            // 3. PyME relations
            await tx.pymeProfile.deleteMany({ where: { userId: targetUserId } });

            // 4. Other relations
            await tx.userRole.deleteMany({ where: { OR: [{ userId: targetUserId }, { email }] } });
            await tx.notification.deleteMany({ where: { userId: targetUserId } });
            await tx.activityLog.deleteMany({ where: { userId: targetUserId } });
            await tx.userDocument.deleteMany({ where: { userId: targetUserId } });
            await tx.payment.deleteMany({ where: { userId: targetUserId } });
            await tx.legalDocument.deleteMany({ where: { userId: targetUserId } });
            await tx.coursePurchase.deleteMany({ where: { userId: targetUserId } });
            await tx.userCourseProgress.deleteMany({ where: { userId: targetUserId } });
            await tx.forumVote.deleteMany({ where: { userId: targetUserId } });
            await tx.forumAnswer.deleteMany({ where: { userId: targetUserId } });
            await tx.forumPost.deleteMany({ where: { userId: targetUserId } });
            await tx.legalCase.deleteMany({ where: { userId: targetUserId } });

            // 5. Delete main User record
            await tx.user.delete({ where: { id: targetUserId } });
        });

        // 6. Delete from Firebase Auth
        try {
            const fbUser = await admin.auth().getUserByEmail(email).catch(() => null);
            if (fbUser) {
                await admin.auth().deleteUser(fbUser.uid);
                console.log(`[deleteUser] Usuario eliminado de Firebase Auth: ${fbUser.uid} (${email})`);
            }
        } catch (fbErr: any) {
            console.warn(`[deleteUser] No se pudo eliminar de Firebase Auth: ${fbErr.message}`);
        }

        res.json({
            success: true,
            message: `Usuario ${email} eliminado permanentemente de la base de datos y de Firebase.`
        });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error al eliminar usuario', details: error.message });
    }
};


