import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const USERS = [
    { email: 'worker_free@test.com', role: 'worker', plan: 'free', password: 'password123', name: 'Juan Pérez (Worker)' },
    { email: 'worker_premium@test.com', role: 'worker', plan: 'pro', password: 'password123', name: 'Carlos López (Worker VIP)' },
    { email: 'lawyer_basic@test.com', role: 'lawyer', plan: 'basic', password: 'password123', name: 'Lic. Ana García' },
    { email: 'lawyer_pro@test.com', role: 'lawyer', plan: 'pro', password: 'password123', name: 'Lic. Roberto Mtz (Pro)' },
    { email: 'pyme_basic@test.com', role: 'pyme', plan: 'basic', password: 'password123', name: 'Tienda La Esquina' },
    { email: 'pyme_premium@test.com', role: 'pyme', plan: 'pro', password: 'password123', name: 'Constructora Elite S.A.' },
];

async function main() {
    console.log('🌱 Starting production seed...');

    for (const u of USERS) {
        const exists = await prisma.user.findUnique({ where: { email: u.email } });
        if (exists) {
            console.log(`✅ User ${u.email} already exists.`);
            continue;
        }

        console.log(`Creating ${u.email}...`);
        const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: u.email,
                    passwordHash,
                    fullName: u.name,
                    role: u.role,
                    plan: u.plan,
                    subscriptionLevel: u.plan === 'pro' ? 'premium' : 'basic', // Align with schema enums roughly
                    isVerified: true
                }
            });

            if (u.role === 'lawyer') {
                const lawyer = await tx.lawyer.create({
                    data: {
                        userId: user.id,
                        licenseNumber: 'DEMO_' + Math.floor(Math.random() * 10000),
                        isVerified: true, // Auto-verify demo lawyers
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
    }

    console.log('✅ Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
