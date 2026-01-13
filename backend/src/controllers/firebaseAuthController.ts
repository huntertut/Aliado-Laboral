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

        if (!email) {
            return res.status(400).json({ error: 'Email not found in token' });
        }

        // Look up user role in database
        let userRole = await prisma.userRole.findUnique({
            where: { firebaseUid }
        });

        if (!userRole) {
            console.warn(`[verifyFirebaseToken] UserRole not found for UID: ${firebaseUid}. Attempting auto-recovery.`);

            // 1. Check if User exists by email
            let existingUser = await prisma.user.findUnique({
                where: { email }
            });

            // 2. Infer Role & Plan from email (for Test Users)
            let derivedRole = 'worker';
            let derivedPlan = 'free';

            if (email.includes('pyme')) {
                derivedRole = 'pyme';
                derivedPlan = email.includes('premium') ? 'premium' : 'free'; // Default to free if basic
            } else if (email.includes('abogado') || email.includes('lawyer')) {
                derivedRole = 'lawyer';
                derivedPlan = 'basic';
            } else if (email.includes('admin')) {
                derivedRole = 'admin';
            }

            // 3. Create User if missing
            if (!existingUser) {
                console.log(`[verifyFirebaseToken] Creating new User for ${email}`);
                existingUser = await prisma.user.create({
                    data: {
                        email,
                        passwordHash: 'firebase_managed', // Placeholder
                        fullName: decodedToken.name || email.split('@')[0],
                        role: derivedRole,
                        plan: derivedPlan
                    }
                });
            }

            // 4. Create or Update UserRole linking to User
            const existingRoleByUserId = await prisma.userRole.findUnique({
                where: { userId: existingUser.id }
            });

            if (existingRoleByUserId) {
                console.log(`[verifyFirebaseToken] Updating existing UserRole for ${email} with new UID`);
                userRole = await prisma.userRole.update({
                    where: { id: existingRoleByUserId.id },
                    data: { firebaseUid }
                });
            } else {
                console.log(`[verifyFirebaseToken] Creating new UserRole for ${email}`);
                userRole = await prisma.userRole.create({
                    data: {
                        firebaseUid,
                        role: existingUser.role,
                        email: existingUser.email,
                        fullName: existingUser.fullName,
                        userId: existingUser.id
                    }
                });
            }

            // Continue to fetching logic...
        }

        // Fetch full User record matching the email to be safe
        let user = await prisma.user.findUnique({
            where: { email: userRole.email },
            include: {
                lawyerProfile: {
                    include: { subscription: true }
                },
                pymeProfile: true
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

            if (userRole.userId !== user.id || userRole.fullName !== user.fullName) {
                console.log(`[verifyFirebaseToken] Syncing UserRole data for ${user.email}. DB Name: "${user.fullName}", Role Name: "${userRole.fullName}"`);
                await prisma.userRole.update({
                    where: { id: userRole.id },
                    data: {
                        userId: user.id,
                        fullName: user.fullName || userRole.fullName
                    }
                });
            }
        } else {
            console.warn(`[verifyFirebaseToken] User NOT FOUND in DB for email: ${userRole.email}`);
        }

        console.log('🔍 [verifyFirebaseToken] Diagnostic:', {
            firebaseName: decodedToken.name,
            dbName: user?.fullName,
            userRoleName: userRole.fullName,
            match: decodedToken.name === user?.fullName
        });

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
                subscriptionLevel: user?.subscriptionLevel || 'basic',
                assignedLawyerId: user?.pymeProfile?.assignedLawyerId,
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

        res.status(500).json({
            error: 'Error al verificar token',
            details: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
};

// Keep old endpoints for backward compatibility (deprecated)
export { register, login } from './authController';
