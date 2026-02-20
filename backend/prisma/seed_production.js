
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding users for Business Model (Production)...');

    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
        // 1. Worker FREE
        {
            id: 'C542fS47Q1ZVLR6xKc68WYL6XI53', // Firebase UID
            email: 'worker_free@test.com',
            passwordHash: hashedPassword,
            fullName: 'Trabajador Gratuito',
            role: 'worker',
            plan: 'free',
            subscriptionStatus: 'inactive',
        },
        // 2. Worker PREMIUM
        {
            id: 'WzgiGwvO3ySXlFnkJU3FiRcAbq53', // Firebase UID
            email: 'worker_premium@test.com',
            passwordHash: hashedPassword,
            fullName: 'Trabajador Premium',
            role: 'worker',
            plan: 'premium',
            subscriptionStatus: 'active',
        },
        // 3. Lawyer BASIC
        {
            id: 'Z4UHLGmk1XcVx8blaT0KTJ5FSQS2', // Firebase UID
            email: 'lawyer_basic@test.com',
            passwordHash: hashedPassword,
            fullName: 'Abogado Plan Basico',
            role: 'lawyer',
            plan: 'basic',
            subscriptionStatus: 'active',
            licenseNumber: 'LBASIC001',
            specialty: 'Laboral General'
        },
        // 4. Lawyer PRO
        {
            id: 'CIaLXDcGO2NOu10bbFr1wZ41j7j2', // Firebase UID
            email: 'lawyer_pro@test.com',
            passwordHash: hashedPassword,
            fullName: 'Abogado Plan Pro',
            role: 'lawyer',
            plan: 'pro',
            subscriptionStatus: 'active',
            licenseNumber: 'LPRO001',
            specialty: 'Defensa Patronal y Laboral'
        },
        // 5. Admin
        {
            id: 'TjPDy7Lyf9MVLIu7e30DOzMysSf1',
            email: 'admin@test.com',
            passwordHash: hashedPassword,
            fullName: 'Admin General',
            role: 'admin',
            plan: 'free',
        },
        // 6. Supervisor
        {
            id: 'owa4rNOIESdMmJIucA06OSXKbh72',
            email: 'supervisor@test.com',
            passwordHash: hashedPassword,
            fullName: 'Supervisor Legal',
            role: 'supervisor',
            plan: 'free',
        },
        // 7. Contador
        {
            id: 'pubVX53drUgWZD6WUfB6TQ0el1y2',
            email: 'contador@test.com',
            passwordHash: hashedPassword,
            fullName: 'Contador App',
            role: 'accountant',
            plan: 'free',
        },
        // 8. Pyme Basic
        {
            id: 'M9KI2uXemYWElMmmDUxuMsM5jG62',
            email: 'pyme_basic@test.com',
            passwordHash: hashedPassword,
            fullName: 'Pyme Básica SA',
            role: 'pyme',
            plan: 'basic',
            subscriptionStatus: 'active'
        },
        // 9. Pyme Premium
        {
            id: 'J5axjxXFuwW2H10fayGZKq0IRTs1',
            email: 'pyme_premium@test.com',
            passwordHash: hashedPassword,
            fullName: 'Pyme Premium SC',
            role: 'pyme',
            plan: 'premium',
            subscriptionStatus: 'active'
        }
    ];

    for (const userData of users) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (existingUser) {
            console.log(`User ${userData.email} found.`);

            // CRITICAL: Ensure database ID matches Firebase/Seed ID
            if (existingUser.id !== userData.id) {
                console.log(`⚠️ Mismatch! DB ID: ${existingUser.id} vs Required: ${userData.id}. Recreating...`);

                // Delete dependencies first (manual cascade)
                await prisma.userRole.deleteMany({ where: { userId: existingUser.id } });
                await prisma.workerSubscription.deleteMany({ where: { userId: existingUser.id } });
                await prisma.pymeProfile.deleteMany({ where: { userId: existingUser.id } });
                await prisma.legalCase.deleteMany({ where: { userId: existingUser.id } });
                await prisma.calculationRecord.deleteMany({ where: { userId: existingUser.id } });
                await prisma.activityLog.deleteMany({ where: { userId: existingUser.id } });
                await prisma.contactRequest.deleteMany({ where: { workerId: existingUser.id } });
                await prisma.workerProfile.deleteMany({ where: { userId: existingUser.id } });
                await prisma.adminAlert.deleteMany({ where: { relatedUserId: existingUser.id } });

                // Handle Lawyer Cascade
                const existingLawyer = await prisma.lawyer.findUnique({ where: { userId: existingUser.id } });
                if (existingLawyer) {
                    await prisma.lawyerProfile.deleteMany({ where: { lawyerId: existingLawyer.id } });
                    await prisma.lawyerSubscription.deleteMany({ where: { lawyerId: existingLawyer.id } });
                    await prisma.pymeProfile.updateMany({
                        where: { assignedLawyerId: existingLawyer.id },
                        data: { assignedLawyerId: null }
                    });
                    await prisma.lawyer.delete({ where: { id: existingLawyer.id } });
                }

                await prisma.user.delete({ where: { email: userData.email } });

                // Create with correct ID
                const newUser = await prisma.user.create({
                    data: {
                        id: userData.id,
                        email: userData.email,
                        passwordHash: userData.passwordHash,
                        fullName: userData.fullName,
                        role: userData.role,
                        plan: userData.plan || 'free',
                    },
                });
                console.log(`✨ Re-created user: ${userData.email} with correct ID.`);
            } else {
                console.log(`✅ ID matches. Updating plan...`);
                await prisma.user.update({
                    where: { email: userData.email },
                    data: {
                        plan: userData.role === 'worker' ? userData.plan : undefined
                    }
                });
            }
        } else {
            // Create User with specific ID
            await prisma.user.create({
                data: {
                    id: userData.id, // Explicit ID from Firebase
                    email: userData.email,
                    passwordHash: userData.passwordHash,
                    fullName: userData.fullName,
                    role: userData.role,
                    plan: userData.plan || 'free',
                },
            });
            console.log(`Created user: ${userData.email}`);
        }

        // Re-fetch user to get ID
        const user = await prisma.user.findUnique({ where: { email: userData.email } });
        if (!user) continue;

        // Handle Worker Subscription
        if (userData.role === 'worker') {
            const existingSub = await prisma.workerSubscription.findUnique({ where: { userId: user.id } });
            if (!existingSub && userData.plan === 'premium') {
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 12);

                await prisma.workerSubscription.create({
                    data: {
                        userId: user.id,
                        status: 'active',
                        startDate: new Date(),
                        endDate: endDate,
                        amount: 29.00,
                        autoRenew: false
                    }
                });
                console.log(` -> Worker Premium subscription created.`);
            }
        }

        // Handle Worker Profile (MISSING PREVIOUSLY)
        if (userData.role === 'worker') {
            const existingProfile = await prisma.workerProfile.findUnique({ where: { userId: user.id } });
            if (!existingProfile) {
                await prisma.workerProfile.create({
                    data: {
                        userId: user.id,
                        occupation: 'Empleado General',
                        federalEntity: 'CDMX',
                        startDate: new Date(),
                        monthlySalary: 15000.00
                    }
                });
                console.log(` -> Worker Profile created.`);
            }
        }

        // Handle Lawyer Subscription
        if (userData.role === 'lawyer') {
            const existingLawyer = await prisma.lawyer.findUnique({ where: { userId: user.id } });
            let lawyerId = existingLawyer ? existingLawyer.id : null;

            if (!existingLawyer) {
                const lawyer = await prisma.lawyer.create({
                    data: {
                        userId: user.id,
                        licenseNumber: userData.licenseNumber,
                        specialty: userData.specialty,
                        isVerified: true,
                        nationalScope: true,
                        availableStates: 'CDMX,Jalisco',
                        professionalName: userData.fullName,
                    }
                });
                lawyerId = lawyer.id;
            }

            if (lawyerId) {
                const existingSub = await prisma.lawyerSubscription.findUnique({ where: { lawyerId } });
                if (!existingSub) {
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + 1);

                    await prisma.lawyerSubscription.create({
                        data: {
                            lawyerId: lawyerId,
                            status: userData.subscriptionStatus,
                            plan: userData.plan,
                            startDate: new Date(),
                            endDate: endDate,
                            amount: userData.plan === 'pro' ? 299.00 : 99.00,
                            autoRenew: true
                        }
                    });
                }
            }
        }

        // Handle Pyme Profile
        if (userData.role === 'pyme') {
            const existingPyme = await prisma.pymeProfile.findUnique({ where: { userId: user.id } });
            if (!existingPyme) {
                await prisma.pymeProfile.create({
                    data: {
                        userId: user.id,
                        razonSocial: userData.fullName,
                        rfc: 'XAXX010101000',
                        industry: 'Servicios',
                        riskScore: 20
                    }
                });
                console.log(` -> Pyme Profile created for ${userData.email}`);
            }
        }

        // Create/Update UserRole mapping
        await prisma.userRole.upsert({
            where: { firebaseUid: userData.id },
            update: {
                userId: user.id,
                role: userData.role,
                email: userData.email,
                fullName: userData.fullName
            },
            create: {
                firebaseUid: userData.id,
                userId: user.id,
                role: userData.role,
                email: userData.email,
                fullName: userData.fullName
            }
        });
        console.log(` -> UserRole mapped for ${userData.email}`);
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
