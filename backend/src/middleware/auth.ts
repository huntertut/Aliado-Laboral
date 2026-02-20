import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import admin from '../config/firebase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.sendStatus(401);
    }

    const token = authHeader.split(' ')[1];

    try {
        // 1. Try Legacy JWT Verification
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded;
            return next();
        } catch (jwtError) {
            // JWT verification failed, proceed to try Firebase
        }

        // 2. Try Firebase ID Token Verification
        const decodedToken = await admin.auth().verifyIdToken(token);
        const firebaseUid = decodedToken.uid;

        // 3. Resolve Database User ID from Firebase UID
        const userRole = await prisma.userRole.findUnique({
            where: { firebaseUid }
        });

        if (userRole) {
            // CRITICAL FIX: Ensure User record exists
            // WorkerProfile and LawyerProfile rely on User.id foreign key
            let userId = userRole.userId;

            if (!userId) {
                console.warn(`UserRole linked to Firebase UID ${firebaseUid} has no associated User record. Fixing...`);

                // First, try to find existing User by email
                let existingUser = await prisma.user.findFirst({
                    where: { email: userRole.email }
                });

                if (!existingUser) {
                    // User doesn't exist, create it
                    console.log(`Creating new User record for ${userRole.email}...`);
                    existingUser = await prisma.user.create({
                        data: {
                            email: userRole.email,
                            fullName: userRole.fullName || userRole.email.split('@')[0],
                            role: userRole.role,
                            passwordHash: 'firebase_managed' // Placeholder since Firebase handles auth
                        }
                    });
                    console.log(`✅ User record created with ID ${existingUser.id}`);
                } else {
                    console.log(`✅ Found existing User record with ID ${existingUser.id} for ${userRole.email}`);
                }

                // Link UserRole to the User (whether found or created)
                await prisma.userRole.update({
                    where: { firebaseUid },
                    data: { userId: existingUser.id }
                });

                userId = existingUser.id;
                console.log(`✅ UserRole linked to User ID ${userId} for Firebase UID ${firebaseUid}`);
            }

            req.user = {
                id: userId,
                userId: userId, // BACKWARD COMPATIBILITY: Some controllers expect .userId
                email: userRole.email,
                role: userRole.role,
                firebaseUid: firebaseUid
            };
            return next();
        } else {
            // Self-Healing Logic: User exists in Firebase but not in DB mapping (UserRole).
            // Instead of blocking (403), we automatically repair the relationship.
            console.log(`[Auth] Self-Healing: Missing UserRole for uid ${firebaseUid}. Attempting repair...`);

            const email = decodedToken.email;
            if (!email) {
                console.error('[Auth] Token missing email, cannot repair.');
                return res.sendStatus(403);
            }

            let finalUserId, finalRole = 'worker'; // Default to worker if unknown

            // 1. Check if User exists by email
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (existingUser) {
                console.log(`[Auth] Found existing User ${existingUser.id}, linking...`);
                finalUserId = existingUser.id;
                finalRole = existingUser.role;
            } else {
                console.log(`[Auth] User not found. Creating new Worker account for ${email}...`);
                // Create minimal User record
                const newUser = await prisma.user.create({
                    data: {
                        email,
                        fullName: decodedToken.name || 'Usuario Nuevo',
                        role: 'worker', // Default role for auto-created users
                        plan: 'free',
                        passwordHash: 'firebase_managed',
                        profileStatus: 'active'
                    }
                });
                finalUserId = newUser.id;

                // Create Worker subscription
                await prisma.workerSubscription.create({
                    data: {
                        userId: newUser.id,
                        status: 'inactive',
                        amount: 0.0,
                        autoRenew: false
                    }
                });
            }

            // 2. Check for existing UserRole by UserId to avoid Unique Constraint violation
            const existingRole = await prisma.userRole.findUnique({
                where: { userId: finalUserId }
            });

            if (existingRole) {
                console.log(`[Auth] Existing UserRole found for User ${finalUserId}. Updating with new Firebase UID...`);
                await prisma.userRole.update({
                    where: { id: existingRole.id },
                    data: { firebaseUid: firebaseUid }
                });
            } else {
                console.log(`[Auth] No UserRole found. Creating new mapping...`);
                await prisma.userRole.create({
                    data: {
                        firebaseUid: firebaseUid,
                        userId: finalUserId,
                        role: finalRole,
                        email: email,
                        fullName: decodedToken.name || 'Usuario'
                    }
                });
            }

            console.log(`[Auth] Self-Healing Successful for ${email}`);

            // 3. Set req.user and proceed
            req.user = {
                id: finalUserId,
                userId: finalUserId, // BACKWARD COMPATIBILITY
                email: email,
                role: finalRole,
                firebaseUid: firebaseUid
            };
            return next();
        }

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.sendStatus(403);
    }
};

export const requireRole = (allowedRoles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        // Fetch the full user object to check for block status
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // NEW: Fraud Block Enforcement
        if (user.isBlocked) {
            return res.status(403).json({
                error: 'Acceso Denegado',
                message: 'Tu cuenta ha sido bloqueada permanentemente.',
                reason: user.blockReason
            });
        }

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: 'Acceso denegado. Rol no autorizado.' });
        }

        // Update req.user with the full user object, including isBlocked and blockReason
        // This ensures subsequent middleware or route handlers have access to this info
        req.user = user;
        next();
    };
};
