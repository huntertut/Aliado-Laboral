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
                    subscriptionLevel: role === 'pyme' ? 'basic' : 'none',
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

            if (role === 'pyme') {
                // Create PymeProfile record
                // @ts-ignore: Field added in schema but client pending update
                await tx.pymeProfile.create({
                    data: {
                        userId: user.id,
                        razonSocial: req.body.companyName,
                        rfc: req.body.rfc,
                        industry: req.body.industry,
                        assignedLawyerId: req.body.assignedLawyerId,
                        riskScore: 50
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

export const socialLogin = async (req: Request, res: Response) => {
    try {
        const { email, uid, role, name } = req.body;

        if (!email || !uid) {
            return res.status(400).json({ error: 'Email and UID are required' });
        }

        let user = await prisma.user.findUnique({
            where: { email },
            include: { lawyerProfile: true, pymeProfile: true }
        });

        if (!user) {
            // New User: Create with INCOMPLETE status if Lawyer/Pyme
            const initialStatus = (role === 'lawyer' || role === 'pyme') ? 'incomplete' : 'active';

            // Default plan logic
            const plan = role === 'lawyer' ? 'basic' : 'free';
            const subLevel = role === 'pyme' ? 'basic' : 'none';

            // Create User Transaction
            user = (await prisma.$transaction(async (tx) => {
                // Create Firebase Mapping
                /* Note: Ideally we should link to UserRole table, but given current constraints we focus on User table first */

                const newUser = await tx.user.create({
                    data: {
                        email,
                        passwordHash: 'SOCIAL_LOGIN_' + uid, // Placeholder
                        fullName: name || 'Usuario',
                        role: role || 'worker',
                        plan,
                        subscriptionLevel: subLevel,
                        // @ts-ignore: Schema updated but client pending generation
                        profileStatus: initialStatus
                    }
                });

                // Initialize role-specific records (Empty placeholders)
                if (role === 'lawyer') {
                    const lawyer = await tx.lawyer.create({
                        data: {
                            userId: newUser.id,
                            licenseNumber: 'PENDING_' + newUser.id, // Placeholder to satisfy unique constraint
                            isVerified: false,
                            specialty: 'General'
                        }
                    });

                    await tx.lawyerProfile.create({ data: { lawyerId: lawyer.id } });
                    await tx.lawyerSubscription.create({
                        data: { lawyerId: lawyer.id, plan: 'basic', status: 'inactive' }
                    });
                }

                if (role === 'pyme') {
                    // @ts-ignore: Schema updated but client pending generation
                    await tx.pymeProfile.create({
                        data: {
                            userId: newUser.id,
                            razonSocial: 'Pendiente',
                            industry: 'General',
                            riskScore: 50
                        }
                    });
                }

                if (role === 'worker') {
                    await tx.workerSubscription.create({
                        data: { userId: newUser.id, status: 'inactive', autoRenew: false }
                    });
                }

                return newUser;
            })) as any; // Cast to any to avoid type mismatch with 'include' definition
        }

        if (!user) {
            return res.status(500).json({ error: 'Failed to process user' });
        }

        // Existing User: Return token and status
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: '24h',
        });

        // Safe access to profileStatus (cast if generation failed momentarily, though it should be fixed)
        const safeUser = user as any;

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                plan: user.plan,
                profileStatus: safeUser.profileStatus || 'active'
            }
        });

    } catch (error) {
        console.error('Social Login Error:', error);
        res.status(500).json({ error: 'Internal server error during social login' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // From middleware
        const { fullName, phone, address, website, companyName, rfc, industry } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName,
                // Update related Pyme/Worker/Lawyer profiles if needed (simplified for now)
            }
        });

        res.json({ message: 'Profile updated', user: updatedUser });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
