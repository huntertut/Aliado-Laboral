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
                id: userId, // Now guaranteed to be a valid User.id
                email: userRole.email,
                role: userRole.role,
                firebaseUid: firebaseUid
            };
            return next();
        } else {
            // User exists in Firebase but not in our SQL DB? 
            // This shouldn't happen if flow is correct, but returning 403 is safe.
            console.warn(`User with valid Firebase Token (${firebaseUid}) not found in DB.`);
            return res.sendStatus(403);
        }

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.sendStatus(403);
    }
};
