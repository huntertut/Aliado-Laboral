import { Request, Response } from 'express';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import admin from '../config/firebase';

// Verify Firebase ID Token and return user data with role
export const verifyFirebaseToken = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'ID Token is required' });
        }

        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decodedToken.uid;
        const email = decodedToken.email;

        // Look up user role in database
        const userRole = await prisma.userRole.findUnique({
            where: { firebaseUid }
        });

        if (!userRole) {
            console.error(`[verifyFirebaseToken] UserRole not found for UID: ${firebaseUid}`);
            return res.status(404).json({
                error: 'Usuario no encontrado en el sistema. Contacta al administrador.'
            });
        }

        // Fetch full User record matching the email to be safe
        let user = await prisma.user.findUnique({
            where: { email: userRole.email },
            include: {
                lawyerProfile: {
                    include: { subscription: true }
                }
            }
        });

        if (user) {
            console.log(`[verifyFirebaseToken] Found User: ${user.email}, Role: ${user.role}, Plan: ${user.plan}`);
            if (user.lawyerProfile) {
                console.log(`[verifyFirebaseToken] Found Lawyer Profile: ${user.lawyerProfile.id}`);
                if (user.lawyerProfile.subscription) {
                    console.log(`[verifyFirebaseToken] Found Lawyer Sub: ${user.lawyerProfile.subscription.plan} (${user.lawyerProfile.subscription.status})`);
                } else {
                    console.log(`[verifyFirebaseToken] Lawyer Sub NOT FOUND`);
                }
            } else {
                console.log(`[verifyFirebaseToken] Lawyer Profile NOT FOUND`);
            }

            // Update UserRole to stay in sync with User
            if (userRole.userId !== user.id || userRole.fullName !== user.fullName) {
                console.log(`[verifyFirebaseToken] Syncing UserRole data for ${user.email}`);
                await prisma.userRole.update({
                    where: { id: userRole.id },
                    data: {
                        userId: user.id,
                        fullName: user.fullName || userRole.fullName
                    }
                });
            }
        } else {
            console.warn(`[verifyFirebaseToken] User NOT FOUND for email: ${userRole.email}`);
        }

        // Determine final plan
        let finalPlan = user?.plan || 'free';
        if (userRole.role === 'lawyer' && user?.lawyerProfile?.subscription) {
            finalPlan = user.lawyerProfile.subscription.plan;
        }

        console.log(`[verifyFirebaseToken] Final Result -> Email: ${userRole.email}, Role: ${userRole.role}, Resolved Plan: ${finalPlan}`);

        // Return user data with plan
        res.json({
            user: {
                id: firebaseUid,
                uid: firebaseUid,
                email: userRole.email,
                fullName: user?.fullName || userRole.fullName,
                role: userRole.role,
                plan: finalPlan,
                _debug: {
                    source: 'UserTable',
                    sync: !!user,
                    dbPlan: user?.plan,
                    lawyerSub: user?.lawyerProfile?.subscription?.plan
                }
            }
        });
    } catch (error: any) {
        console.error('Error verifying Firebase token:', error);

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar sesión.' });
        }

        if (error.code === 'auth/argument-error') {
            return res.status(400).json({ error: 'Token inválido' });
        }

        res.status(500).json({ error: 'Error al verificar token' });
    }
};

// Keep old endpoints for backward compatibility (deprecated)
export { register, login } from './authController';
