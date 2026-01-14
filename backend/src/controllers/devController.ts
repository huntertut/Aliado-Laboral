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

            // FORCE FIX: Always update the User Plan to match the seed config
            const updatedUser = await prisma.user.upsert({
                where: { email: u.email },
                update: {
                    role: u.role,
                    plan: u.plan,
                    subscriptionLevel: u.plan === 'pro' ? 'premium' : 'basic',
                    fullName: u.name,
                    profileStatus: 'active'
                },
                create: {
                    email: u.email,
                    passwordHash: await bcrypt.hash(u.password, SALT_ROUNDS),
                    fullName: u.name,
                    role: u.role,
                    plan: u.plan,
                    subscriptionLevel: u.plan === 'pro' ? 'premium' : 'basic',
                    profileStatus: 'active'
                }
            });
            userId = updatedUser.id;
            results.push(`Synced User: ${u.email} (Plan: ${u.plan})`);

            // REPAIR LOGIC: Upsert Profiles
            if (u.role === 'lawyer') {
                const lawyer = await prisma.lawyer.upsert({
                    where: { userId: userId },
                    update: {
                        isVerified: true,
                        acceptsPymeClients: u.plan === 'pro'
                    },
                    create: {
                        userId: userId,
                        licenseNumber: 'DEMO_' + Math.floor(Math.random() * 10000),
                        isVerified: true,
                        specialty: 'Laboral',
                        professionalName: u.name,
                        acceptsPymeClients: u.plan === 'pro'
                    }
                });

                await prisma.lawyerProfile.upsert({
                    where: { lawyerId: lawyer.id },
                    update: {},
                    create: { lawyerId: lawyer.id }
                });

                const now = new Date();
                const nextMonth = new Date();
                nextMonth.setDate(now.getDate() + 30);

                await prisma.lawyerSubscription.upsert({
                    where: { lawyerId: lawyer.id },
                    update: {
                        plan: u.plan,
                        status: 'active',
                        startDate: now,
                        endDate: nextMonth
                    },
                    create: {
                        lawyerId: lawyer.id,
                        plan: u.plan,
                        status: 'active',
                        amount: u.plan === 'pro' ? 299 : 99,
                        autoRenew: true,
                        startDate: now,
                        endDate: nextMonth
                    }
                });
                results.push(`Forced Lawyer Profile & Sub (Dates Fixed) for: ${u.email}`);
            }

            if (u.role === 'pyme') {
                // Upsert Pyme
                const pyme = await prisma.pymeProfile.findUnique({ where: { userId } });
                if (pyme) {
                    await prisma.pymeProfile.update({
                        where: { id: pyme.id },
                        data: { riskScore: 85 } // Dummy update to keep it valid
                    });
                } else {
                    await prisma.pymeProfile.create({
                        data: {
                            userId,
                            razonSocial: u.name,
                            industry: 'Comercio',
                            riskScore: 85
                        }
                    });
                }
                results.push(`Synced Pyme Profile for: ${u.email}`);
            }

            // Existing UserRole Link Logic (Keep as is)


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
