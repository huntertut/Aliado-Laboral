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

            const exists = await prisma.user.findUnique({ where: { email: u.email } });
            if (exists) {
                results.push(`DB Skipped: ${u.email} (Exists)`);
                continue;
            }

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
                        // @ts-ignore
                        profileStatus: 'active'
                    }
                });

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

                // IMPORTANT: Create UserRole mapping for Auth Middleware
                const fbUser = await admin.auth().getUserByEmail(u.email);
                await tx.userRole.create({
                    data: {
                        firebaseUid: fbUser.uid,
                        role: u.role,
                        email: u.email,
                        fullName: u.name,
                        userId: user.id
                    }
                });
            });
            results.push(`Created: ${u.email}`);
        }

        res.json({ message: 'Seeding completed', results });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Seeding failed' });
    }
};
