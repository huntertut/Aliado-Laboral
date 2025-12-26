import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().optional(),
    role: z.enum(['worker', 'lawyer']).optional(),
    licenseNumber: z.string().optional(),
    specialty: z.string().optional(),
});

export const register = async (req: Request, res: Response) => {
    try {
        // Parse request body with Zod schema (add extra fields for lawyer if needed)
        const { email, password, fullName, role, licenseNumber, specialty, nationalScope, acceptsFederalCases, acceptsLocalCases, requiresPhysicalPresence } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Validate lawyer data if role is lawyer
        if (role === 'lawyer' && !licenseNumber) {
            return res.status(400).json({ error: 'License number is required for lawyers' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Use transaction to create User and optionally Lawyer
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    fullName,
                    role: role || 'worker',
                    // Business Model: Default Plan
                    plan: role === 'lawyer' ? 'basic' : 'free',
                },
            });

            if (role === 'worker') {
                // Create initial inactive subscription for worker
                await tx.workerSubscription.create({
                    data: {
                        userId: user.id,
                        status: 'inactive',
                        amount: 29.00,
                        autoRenew: false
                    }
                });
            }

            if (role === 'lawyer') {
                // Create Lawyer record matching the current schema
                const lawyer = await tx.lawyer.create({
                    data: {
                        userId: user.id,
                        licenseNumber: licenseNumber!,
                        specialty: specialty || 'General',
                        professionalName: fullName, // Guardar nombre profesional desde registro
                        isVerified: false, // Explicitly set to false
                        nationalScope: nationalScope || false,
                        availableStates: '',
                        acceptsFederalCases: acceptsFederalCases || false,
                        acceptsLocalCases: acceptsLocalCases !== undefined ? acceptsLocalCases : true,
                        requiresPhysicalPresence: requiresPhysicalPresence !== undefined ? requiresPhysicalPresence : true,
                    },
                });

                // Create empty LawyerProfile
                await tx.lawyerProfile.create({
                    data: {
                        lawyerId: lawyer.id
                    }
                });

                // Create initial inactive subscription for lawyer (Basic Plan)
                await tx.lawyerSubscription.create({
                    data: {
                        lawyerId: lawyer.id,
                        plan: 'basic',
                        status: 'inactive',
                        amount: 99.00,
                        autoRenew: true
                    }
                });
            }

            return user;
        });

        const token = jwt.sign({ userId: result.id, role: result.role }, JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(201).json({ token, user: { id: result.id, email: result.email, role: result.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
            include: { lawyerProfile: true } // Include lawyer relation to check verification
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check verification for lawyers
        if (user.role === 'lawyer') {
            // The relation in User model is named 'lawyerProfile' but points to 'Lawyer' model
            // (based on schema: lawyerProfile Lawyer?)
            if (user.lawyerProfile && !user.lawyerProfile.isVerified) {
                return res.status(403).json({
                    error: 'Account pending verification',
                    message: 'Tu cuenta está pendiente de verificación por un administrador. Te notificaremos cuando sea aprobada.'
                });
            }
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                plan: user.plan // Return plan to frontend
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
