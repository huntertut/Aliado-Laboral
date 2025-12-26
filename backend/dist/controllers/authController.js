"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    fullName: zod_1.z.string().optional(),
    role: zod_1.z.enum(['worker', 'lawyer']).optional(),
    licenseNumber: zod_1.z.string().optional(),
    specialty: zod_1.z.string().optional(),
});
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Parse request body with Zod schema (add extra fields for lawyer if needed)
        const { email, password, fullName, role, licenseNumber, specialty, nationalScope, acceptsFederalCases, acceptsLocalCases, requiresPhysicalPresence } = req.body;
        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Validate lawyer data if role is lawyer
        if (role === 'lawyer' && !licenseNumber) {
            return res.status(400).json({ error: 'License number is required for lawyers' });
        }
        const passwordHash = yield bcrypt_1.default.hash(password, SALT_ROUNDS);
        // Use transaction to create User and optionally Lawyer
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield tx.user.create({
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
                yield tx.workerSubscription.create({
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
                const lawyer = yield tx.lawyer.create({
                    data: {
                        userId: user.id,
                        licenseNumber: licenseNumber,
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
                yield tx.lawyerProfile.create({
                    data: {
                        lawyerId: lawyer.id
                    }
                });
                // Create initial inactive subscription for lawyer (Basic Plan)
                yield tx.lawyerSubscription.create({
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
        }));
        const token = jsonwebtoken_1.default.sign({ userId: result.id, role: result.role }, JWT_SECRET, {
            expiresIn: '1h',
        });
        res.status(201).json({ token, user: { id: result.id, email: result.email, role: result.role } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma.user.findUnique({
            where: { email },
            include: { lawyerProfile: true } // Include lawyer relation to check verification
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const validPassword = yield bcrypt_1.default.compare(password, user.passwordHash);
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
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.login = login;
