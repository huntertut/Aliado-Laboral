import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

import admin from '../config/firebase';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const seedProductionUsers = async (req: Request, res: Response) => {
    try {
        const { secret } = req.query;
        if (secret !== 'hunter2_production_secret') { // Simple protection
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const USERS = [
            { email: 'worker_free@test.com', role: 'worker', plan: 'free', password: 'password123', name: 'Juan Pérez (Worker)' },
            { email: 'worker_premium@test.com', role: 'worker', plan: 'pro', password: 'password123', name: 'Carlos López (Worker VIP)' },
            { email: 'lawyer_basic@test.com', role: 'lawyer', plan: 'basic', password: 'password123', name: 'Lic. Ana García' },
            { email: 'lawyer_pro@test.com', role: 'lawyer', plan: 'pro', password: 'password123', name: 'Lic. Roberto Mtz (Pro)' },
            { email: 'pyme_basic@test.com', role: 'pyme', plan: 'basic', password: 'password123', name: 'Tienda La Esquina' },
            { email: 'pyme_premium@test.com', role: 'pyme', plan: 'pro', password: 'password123', name: 'Constructora Elite S.A.' },
        ];

        const results = [];

        for (const u of USERS) {
            // 1. Ensure Firebase User Exists
            try {
                await admin.auth().getUserByEmail(u.email);
                // If no error, user exists
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                    await admin.auth().createUser({
                        email: u.email,
                        password: u.password,
                        displayName: u.name,
                        emailVerified: true
                    });
                    results.push(`Firebase Created: ${u.email}`);
                }
            }

            let userId = '';

            const existingUser = await prisma.user.findUnique({ where: { email: u.email } });

            if (existingUser) {
                userId = existingUser.id;
                results.push(`DB User Exists: ${u.email}`);

                // REPAIR LOGIC: Aggressively check and fix missing profiles
                if (u.role === 'lawyer') {
                    // Check if Lawyer Base Record exists
                    const existingLawyer = await prisma.lawyer.findFirst({ where: { userId } });

                    if (!existingLawyer) {
                        const lawyer = await prisma.lawyer.create({
                            data: {
                                userId,
                                licenseNumber: 'DEMO_' + Math.floor(Math.random() * 10000),
                                isVerified: true,
                                specialty: 'Laboral',
                                professionalName: u.name,
                                acceptsPymeClients: u.plan === 'pro'
                            }
                        });
                        // Create dependencies
                        await prisma.lawyerProfile.create({ data: { lawyerId: lawyer.id } });
                        await prisma.lawyerSubscription.create({
                            data: {
                                lawyerId: lawyer.id,
                                plan: u.plan,
                                status: 'active',
                                amount: u.plan === 'pro' ? 299 : 99,
                                autoRenew: true
                            }
                        });
                        results.push(`Repaired Lawyer Profile (Created Full Stack) for: ${u.email}`);
                    } else {
                        // Lawyer exists, checks if Subscription exists
                        const sub = await prisma.lawyerSubscription.findUnique({ where: { lawyerId: existingLawyer.id } });
                        if (!sub) {
                            await prisma.lawyerSubscription.create({
                                data: {
                                    lawyerId: existingLawyer.id,
                                    plan: u.plan,
                                    status: 'active',
                                    amount: u.plan === 'pro' ? 299 : 99,
                                    autoRenew: true
                                }
                            });
                            results.push(`Repaired Lawyer Subscription (Missing Sub) for: ${u.email}`);
                        }
                    }
                }

                if (u.role === 'pyme') {
                    const existingPyme = await prisma.pymeProfile.findUnique({ where: { userId } });
                    if (!existingPyme) {
                        // @ts-ignore
                        await prisma.pymeProfile.create({
                            data: {
                                userId,
                                razonSocial: u.name,
                                industry: 'Comercio',
                                riskScore: 85
                            }
                        });
                        results.push(`Repaired Pyme Profile for: ${u.email}`);
                    }
                    // Ensure User has correct subscription level
                    await prisma.user.update({
                        where: { id: userId },
                        data: { subscriptionLevel: u.plan === 'pro' ? 'premium' : 'basic' }
                    });
                }
            } else {
                // User doesn't exist, Create everything
                const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);

                await prisma.$transaction(async (tx) => {
                    const user = await tx.user.create({
                        data: {
                            email: u.email,
                            passwordHash,
                            fullName: u.name,
                            role: u.role,
                            plan: u.plan,
                            subscriptionLevel: u.plan === 'pro' ? 'premium' : 'basic',
                            profileStatus: 'active'
                        }
                    });
                    userId = user.id;

                    if (u.role === 'lawyer') {
                        const lawyer = await tx.lawyer.create({
                            data: {
                                userId: user.id,
                                licenseNumber: 'DEMO_' + Math.floor(Math.random() * 10000),
                                isVerified: true,
                                specialty: 'Laboral',
                                professionalName: u.name,
                                acceptsPymeClients: u.plan === 'pro'
                            }
                        });
                        await tx.lawyerProfile.create({ data: { lawyerId: lawyer.id } });
                        await tx.lawyerSubscription.create({
                            data: {
                                lawyerId: lawyer.id,
                                plan: u.plan,
                                status: 'active',
                                amount: u.plan === 'pro' ? 299 : 99,
                                autoRenew: true
                            }
                        });
                    }

                    if (u.role === 'pyme') {
                        // @ts-ignore
                        await tx.pymeProfile.create({
                            data: {
                                userId: user.id,
                                razonSocial: u.name,
                                industry: 'Comercio',
                                riskScore: 85
                            }
                        });
                    }

                    if (u.role === 'worker') {
                        await tx.workerSubscription.create({
                            data: {
                                userId: user.id,
                                status: u.plan === 'pro' ? 'active' : 'inactive',
                                amount: 29.00,
                                autoRenew: false
                            }
                        });
                    }
                });
                results.push(`Created DB User: ${u.email}`);
            }

            // ALWAYS Ensure UserRole Exists (Repair Logic)
            if (userId) {
                try {
                    const fbUser = await admin.auth().getUserByEmail(u.email);

                    // 1. Check if UserRole exists by Firebase UID
                    const roleByUid = await prisma.userRole.findUnique({ where: { firebaseUid: fbUser.uid } });

                    // 2. Check if UserRole exists by DB User ID
                    const roleByUserId = await prisma.userRole.findUnique({ where: { userId: userId } });

                    if (roleByUid) {
                        // Role exists for this UID. Ensure it points to correct User ID.
                        if (roleByUid.userId !== userId) {
                            await prisma.userRole.update({
                                where: { id: roleByUid.id },
                                data: { userId: userId }
                            });
                            results.push(`Repaired UserRole (Link Updated) for: ${u.email}`);
                        }
                    } else if (roleByUserId) {
                        // Role exists for this User ID (but different UID). Update UID.
                        await prisma.userRole.update({
                            where: { id: roleByUserId.id },
                            data: { firebaseUid: fbUser.uid }
                        });
                        results.push(`Repaired UserRole (UID Updated) for: ${u.email}`);
                    } else {
                        // Neither exists. Safe to create.
                        await prisma.userRole.create({
                            data: {
                                firebaseUid: fbUser.uid,
                                role: u.role,
                                email: u.email,
                                fullName: u.name,
                                userId: userId
                            }
                        });
                        results.push(`Created UserRole for: ${u.email}`);
                    }
                } catch (e: any) {
                    results.push(`Error checking UserRole for ${u.email}: ${e.message}`);
                }
            }
        }

        res.json({ message: 'Seeding completed', results });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Seeding failed' });
    }
};
