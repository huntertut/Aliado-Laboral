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
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Seeding users...');
        const password = '123456';
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const users = [
            // 1. Standard Worker
            {
                email: 'worker_std@test.com',
                passwordHash: hashedPassword,
                fullName: 'Trabajador Estandar',
                role: 'worker',
                subscriptionStatus: 'inactive', // inactive
            },
            // 2. Worker Pro (Active Subscription)
            {
                email: 'worker_pro@test.com',
                passwordHash: hashedPassword,
                fullName: 'Trabajador Pro',
                role: 'worker',
                subscriptionStatus: 'active', // active
            },
            // 3. Lawyer Pro 1 (Active Subscription)
            {
                email: 'lawyer_pro1@test.com',
                passwordHash: hashedPassword,
                fullName: 'Abogado Pro Uno',
                role: 'lawyer',
                subscriptionStatus: 'active',
                licenseNumber: 'L12345678',
            },
            // 4. Lawyer Pro 2 (Active Subscription)
            {
                email: 'lawyer_pro2@test.com',
                passwordHash: hashedPassword,
                fullName: 'Abogado Pro Dos',
                role: 'lawyer',
                subscriptionStatus: 'active',
                licenseNumber: 'L87654321',
            },
            // 5. Admin
            {
                email: 'admin@test.com',
                passwordHash: hashedPassword,
                fullName: 'Admin User',
                role: 'admin',
                subscriptionStatus: 'inactive',
            },
        ];
        for (const userData of users) {
            // Check if user exists
            const existingUser = yield prisma.user.findUnique({
                where: { email: userData.email },
            });
            if (existingUser) {
                console.log(`User ${userData.email} already exists. Skipping.`);
                continue;
            }
            // Create User
            const user = yield prisma.user.create({
                data: {
                    email: userData.email,
                    passwordHash: userData.passwordHash,
                    fullName: userData.fullName,
                    role: userData.role,
                },
            });
            console.log(`Created user: ${userData.email}`);
            // Handle Roles
            if (userData.role === 'worker') {
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 1);
                yield prisma.workerSubscription.create({
                    data: {
                        userId: user.id,
                        status: userData.subscriptionStatus,
                        startDate: new Date(),
                        endDate: endDate,
                        amount: 29.00,
                        autoRenew: true
                    }
                });
                console.log(` -> Worker subscription set to ${userData.subscriptionStatus}`);
            }
            if (userData.role === 'lawyer') {
                const lawyer = yield prisma.lawyer.create({
                    data: {
                        userId: user.id,
                        licenseNumber: userData.licenseNumber,
                        specialty: 'Laboral',
                        isVerified: true,
                        nationalScope: true,
                        availableStates: 'CDMX,Jalisco',
                    }
                });
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 2);
                yield prisma.lawyerSubscription.create({
                    data: {
                        lawyerId: lawyer.id,
                        status: userData.subscriptionStatus,
                        startDate: new Date(),
                        endDate: endDate,
                        amount: 99.00,
                        autoRenew: true
                    }
                });
                // Also create LawyerProfile for "full" pro experience
                yield prisma.lawyerProfile.create({
                    data: {
                        lawyerId: lawyer.id,
                        yearsOfExperience: 5,
                        bio: 'Abogado especialista en defensa laboral.',
                        phone: '5512345678',
                        whatsapp: '5512345678'
                    }
                });
                console.log(` -> Lawyer profile and subscription set.`);
            }
        }
        console.log('Seeding complete.');
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
